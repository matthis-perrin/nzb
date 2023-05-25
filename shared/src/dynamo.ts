import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {
  BatchGetCommand,
  BatchWriteCommand,
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

import {
  Account,
  DownloadStatus,
  HealthStatus,
  ImdbNzbInfo,
  ImdbNzbInfoLight,
  NzbDaemonStatus,
  NzbDaemonTargetState,
  NzbGetStatus,
  NzbsuItem,
  TmdbMovieItem,
  TmdbTvShowItem,
} from '@shared/models';
import {asMapArrayOrThrow, asMapOrThrow, asStringOrThrow} from '@shared/type_utils';

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({region: 'eu-west-3'}), {
  marshallOptions: {removeUndefinedValues: true},
});

const VERSION = '0';

export async function getNzbsuItem(guid: string): Promise<NzbsuItem | undefined> {
  const res = await dynamoDb.send(
    new GetCommand({
      TableName: 'Nzbsu',
      Key: {guid},
    })
  );
  return res.Item as NzbsuItem | undefined;
}

export async function batchGetNzbsuItem(
  guids: string[]
): Promise<Record<string, NzbsuItem | undefined>> {
  const deduped = [...new Set(guids).values()];
  const res = await dynamoDb.send(
    new BatchGetCommand({
      RequestItems: {
        Nzbsu: {Keys: deduped.map(guid => ({guid}))},
      },
    })
  );
  const items = res.Responses?.['Nzbsu'] ?? [];
  const itemsMap: Record<string, NzbsuItem | undefined> = {};
  for (const item of items) {
    const nzbsuItem = item as NzbsuItem;
    itemsMap[nzbsuItem.guid] = nzbsuItem;
  }
  return Object.fromEntries(deduped.map(id => [id, itemsMap[id]]));
}

export async function getImdbInfoItem(imdbId: string): Promise<ImdbNzbInfo | undefined> {
  const res = await dynamoDb.send(
    new GetCommand({
      TableName: 'ImdbInfo',
      Key: {
        imdbId,
      },
    })
  );
  return res.Item as ImdbNzbInfo | undefined;
}

export async function getTmdbMovieItem(imdbId: string): Promise<TmdbMovieItem | undefined> {
  const res = await dynamoDb.send(
    new QueryCommand({
      TableName: 'TmdbMovie',
      IndexName: 'TmdbMovie_ByImdbId',
      KeyConditions: {
        imdb_id: {ComparisonOperator: 'EQ', AttributeValueList: [imdbId]},
      },
    })
  );
  return res.Items?.[0] as TmdbMovieItem;
}

export async function getTmdbTvShowItem(imdbId: string): Promise<TmdbTvShowItem | undefined> {
  const res = await dynamoDb.send(
    new QueryCommand({
      TableName: 'TmdbTvShow',
      IndexName: 'TmdbTvShow_ByImdbId',
      KeyConditions: {
        imdb_id: {ComparisonOperator: 'EQ', AttributeValueList: [imdbId]},
      },
    })
  );
  return res.Items?.[0] as TmdbTvShowItem;
}

export async function putTmdbMovieItem(item: TmdbMovieItem): Promise<void> {
  await dynamoDb.send(
    new PutCommand({
      TableName: 'TmdbMovie',
      Item: {
        ...item,
        v: VERSION,
      },
    })
  );
}

export async function putTmdbTvShowItem(item: TmdbTvShowItem): Promise<void> {
  await dynamoDb.send(
    new PutCommand({
      TableName: 'TmdbTvShow',
      Item: {
        ...item,
        v: VERSION,
      },
    })
  );
}

const lightAttributes = [
  'imdbId',
  'title',
  'image',
  'posters',
  'backdrops',
  'images',
  'releaseDate',
  'runtimeMins',
  'plot',
  'awards',
  'genres',
  'countries',
  'languages',
  'imdbRatingVotes',
  'imdbRating',
  'metacriticRating',
  'theMovieDbRating',
  'rottenTomatoesRating',
  'bestNzbId',
  'bestNzbSize',
  'bestNzbDate',
  'bestNzbTitle',
];

export async function getImdbInfoItemLight(imdbId: string): Promise<ImdbNzbInfoLight | undefined> {
  const res = await dynamoDb.send(
    new GetCommand({
      TableName: 'ImdbInfo',
      Key: {
        imdbId,
      },
      ProjectionExpression: lightAttributes.join(', '),
    })
  );
  return res.Item as ImdbNzbInfo | undefined;
}

export async function putImdbInfoItem(item: ImdbNzbInfo): Promise<void> {
  await dynamoDb.send(
    new PutCommand({
      TableName: 'ImdbInfo',
      Item: {
        ...item,
        v: VERSION,
      },
    })
  );
}

export async function updateTmdbBestNzb(tmdbId: number, nzbItem: NzbsuItem): Promise<void> {
  await dynamoDb.send(
    new UpdateCommand({
      TableName: 'TmdbMovie',
      Key: {id: tmdbId},
      UpdateExpression:
        'SET #bestNzbId = :bestNzbId, #bestNzbSize = :bestNzbSize, #bestNzbDate = :bestNzbDate, #bestNzbTitle = :bestNzbTitle',
      ExpressionAttributeNames: {
        '#bestNzbId': 'bestNzbId',
        '#bestNzbSize': 'bestNzbSize',
        '#bestNzbDate': 'bestNzbDate',
        '#bestNzbTitle': 'bestNzbTitle',
      },
      ExpressionAttributeValues: {
        ':bestNzbId': nzbItem.guid,
        ':bestNzbSize': nzbItem.size,
        ':bestNzbDate': nzbItem.pubTs,
        ':bestNzbTitle': nzbItem.title,
      },
    })
  );
}

export async function queryLastReleasedImdbInfoItems(limit: number): Promise<ImdbNzbInfoLight[]> {
  const res = await dynamoDb.send(
    new QueryCommand({
      TableName: 'ImdbInfo',
      IndexName: 'Nzbsu_All_SortedByReleaseDate',
      KeyConditions: {
        v: {ComparisonOperator: 'EQ', AttributeValueList: [VERSION]},
      },
      Limit: limit,
      ScanIndexForward: false,
      ProjectionExpression: lightAttributes.join(', '),
    })
  );
  return res.Items as ImdbNzbInfoLight[];
}

export async function insertNzbsuItems(items: NzbsuItem[]): Promise<void> {
  const MAX_PER_BATCH = 25;
  let index = 0;
  while (index < items.length) {
    const batch = items.slice(index, index + MAX_PER_BATCH);
    index += MAX_PER_BATCH;
    // eslint-disable-next-line no-await-in-loop
    await dynamoDb.send(
      new BatchWriteCommand({
        RequestItems: {
          Nzbsu: batch.map(item => ({
            PutRequest: {
              Item: {...item, v: VERSION},
            },
          })),
        },
      })
    );
  }
}

export async function insertNzbsuItem(item: NzbsuItem): Promise<void> {
  await dynamoDb.send(
    new PutCommand({
      TableName: 'Nzbsu',
      Item: {...item, v: VERSION},
    })
  );
}

export async function deleteNzbsuItem(guid: string): Promise<void> {
  await dynamoDb.send(
    new DeleteCommand({
      TableName: 'Nzbsu',
      Key: {
        guid,
      },
    })
  );
}

export async function getLastNzbsuItem(): Promise<NzbsuItem> {
  const res = await dynamoDb.send(
    new QueryCommand({
      TableName: 'Nzbsu',
      IndexName: 'Nzbsu_All_SortedByPubTs',
      KeyConditions: {
        v: {ComparisonOperator: 'EQ', AttributeValueList: [VERSION]},
      },
      Limit: 1,
      ScanIndexForward: false,
    })
  );
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return asMapArrayOrThrow(res.Items)[0]! as NzbsuItem;
}

export async function queryNzbsuItemsByImdb(imdbId: string, limit: number): Promise<NzbsuItem[]> {
  const res = await dynamoDb.send(
    new QueryCommand({
      TableName: 'Nzbsu',
      IndexName: 'Nzbsu_ByImdbId_SortedByPubTs',
      KeyConditions: {
        imdbId: {ComparisonOperator: 'EQ', AttributeValueList: [imdbId]},
      },
      Limit: limit,
      ScanIndexForward: false,
    })
  );
  return asMapArrayOrThrow(res.Items) as NzbsuItem[];
}

export async function queryNzbsuItemsBeforePubTs(
  pubTs: number,
  limit: number
): Promise<NzbsuItem[]> {
  const res = await dynamoDb.send(
    new QueryCommand({
      TableName: 'Nzbsu',
      IndexName: 'Nzbsu_All_SortedByPubTs',
      KeyConditions: {
        v: {ComparisonOperator: 'EQ', AttributeValueList: [VERSION]},
        pubTs: {ComparisonOperator: 'LE', AttributeValueList: [pubTs]},
      },
      Limit: limit,
      ScanIndexForward: false,
    })
  );
  return asMapArrayOrThrow(res.Items) as NzbsuItem[];
}

export async function updateNzbsuItemsWithImdbInfo(
  guid: string,
  id: string,
  title: string
): Promise<void> {
  await dynamoDb.send(
    new UpdateCommand({
      TableName: 'Nzbsu',
      Key: {guid},
      UpdateExpression: 'SET imdbId = :id, imdbTitle = :title',
      ExpressionAttributeValues: {
        ':id': id,
        ':title': title,
      },
    })
  );
}

export async function getParameters(): Promise<Record<string, string>> {
  const items = await dynamoDb.send(new ScanCommand({TableName: 'NzbParameters'}));
  return Object.fromEntries(
    (items.Items ?? []).map<[string, string]>(item => [
      asStringOrThrow(item['key']),
      asStringOrThrow(item['value']),
    ])
  );
}

export async function setParameter(key: string, value: string): Promise<void> {
  await dynamoDb.send(
    new UpdateCommand({
      TableName: 'NzbParameters',
      Key: {key},
      UpdateExpression: 'SET #value = :value',
      ExpressionAttributeValues: {
        ':value': value,
      },
      ExpressionAttributeNames: {
        '#value': 'value',
      },
    })
  );
}

export async function getNextNzbToCheck(): Promise<NzbsuItem | undefined> {
  const res = await dynamoDb.send(
    new QueryCommand({
      TableName: 'Nzbsu',
      IndexName: 'Nzbsu_ByHealthFailure_SortedByHealthTs',
      KeyConditions: {
        healthStatus: {ComparisonOperator: 'EQ', AttributeValueList: [HealthStatus.Unknown]},
      },
      Limit: 1,
      ScanIndexForward: true,
    })
  );
  return asMapOrThrow(res.Items?.[0]) as NzbsuItem;
}

export async function updateNzbsuItemsHealth(
  guid: string,
  healthStatus: string,
  healthFailed: number,
  healthSuccess: number
): Promise<void> {
  await dynamoDb.send(
    new UpdateCommand({
      TableName: 'Nzbsu',
      Key: {guid},
      UpdateExpression:
        'SET healthStatus = :healthStatus, healthTs = :healthTs, healthFailed = :healthFailed, healthSuccess = :healthSuccess',
      ExpressionAttributeValues: {
        ':healthStatus': healthStatus,

        ':healthTs': Date.now(),

        ':healthFailed': healthFailed,

        ':healthSuccess': healthSuccess,
      },
    })
  );
}

function parseNzbDaemonStatus(res: unknown): NzbDaemonStatus {
  const item = asMapOrThrow(res);
  /* eslint-disable @typescript-eslint/no-dynamic-delete */
  delete item['accountId_nzbId'];
  delete item['accountId_imdbId'];
  delete item['accountId_targetState'];
  /* eslint-enable @typescript-eslint/no-dynamic-delete */
  return item as NzbDaemonStatus;
}

// export async function batchGetNzbDaemonStatus(
//   accountId: string,
//   nzbIds: string[]
// ): Promise<Map<string, NzbDaemonStatus>> {
//   const items = new Map<string, NzbDaemonStatus>();

//   const MAX_PER_BATCH = 100;
//   let index = 0;
//   while (index < nzbIds.length) {
//     const batch = nzbIds.slice(index, index + MAX_PER_BATCH);
//     index += MAX_PER_BATCH;
//     // eslint-disable-next-line no-await-in-loop
//     const res = await dynamoDb.send(
//       new BatchGetCommand({
//         RequestItems: {
//           NzbDaemonStatus: {
//             // eslint-disable-next-line @typescript-eslint/naming-convention
//             Keys: batch.map(nzbId => ({accountId_nzbId: `${accountId}_${nzbId}`})),
//           },
//         },
//       })
//     );
//     if (res.Responses) {
//       for (const item of res.Responses.NzbDaemonStatus ?? []) {
//         delete item.accountId_nzbId;
//         delete item.accountId_imdbId;
//         delete item.accountId_targetState;
//         const parsedItem = item as NzbDaemonStatus;
//         items.set(parsedItem.nzbId, parsedItem);
//       }
//     }
//   }

//   return items;
// }

export async function queryNzbDaemonStatusByImdbId(
  accountId: string,
  imdbId: string
): Promise<NzbDaemonStatus[]> {
  const res = await dynamoDb.send(
    new QueryCommand({
      TableName: 'NzbDaemonStatus',
      IndexName: 'NzbDaemonStatus_ByAccountIdImdbId',
      KeyConditions: {
        accountId_imdbId: {
          ComparisonOperator: 'EQ',
          AttributeValueList: [`${accountId}_${imdbId}`],
        },
      },
    })
  );
  return (res.Items ?? []).map(parseNzbDaemonStatus);
}

export async function queryNzbDaemonStatusByTargetState(
  accountId: string,
  targetState: NzbDaemonTargetState
): Promise<NzbDaemonStatus[]> {
  const res = await dynamoDb.send(
    new QueryCommand({
      TableName: 'NzbDaemonStatus',
      IndexName: 'NzbDaemonStatus_ByAccountIdTargetState',
      KeyConditions: {
        accountId_targetState: {
          ComparisonOperator: 'EQ',
          AttributeValueList: [`${accountId}_${targetState}`],
        },
      },
    })
  );
  return (res.Items ?? []).map(parseNzbDaemonStatus);
}

export async function updateNzbDaemonStatusTargetState(
  accountId: string,
  nzbId: string,
  targetState: NzbDaemonTargetState
): Promise<void> {
  await dynamoDb.send(
    new UpdateCommand({
      TableName: 'NzbDaemonStatus',
      Key: {
        accountId_nzbId: `${accountId}_${nzbId}`,
      },
      UpdateExpression: 'SET targetState = :targetState',
      ExpressionAttributeValues: {
        ':targetState': targetState,
      },
    })
  );
}

export async function updateNzbDaemonStatusDownloadStatus(
  accountId: string,
  nzbId: string,
  downloadStatus?: DownloadStatus
): Promise<void> {
  await dynamoDb.send(
    new UpdateCommand({
      TableName: 'NzbDaemonStatus',
      Key: {
        accountId_nzbId: `${accountId}_${nzbId}`,
      },
      UpdateExpression: 'SET downloadStatus = :downloadStatus',
      ExpressionAttributeValues: {
        ':downloadStatus': downloadStatus,
      },
    })
  );
}

export async function insertNzbDaemonStatus(
  accountId: string,
  imdbId: string,
  nzbId: string,
  nzbTitle: string,
  nzbPubTs: number,
  nzbSize: number,
  targetState: NzbDaemonTargetState
): Promise<void> {
  await dynamoDb.send(
    new PutCommand({
      TableName: 'NzbDaemonStatus',
      Item: {
        accountId_nzbId: `${accountId}_${nzbId}`,
        accountId_imdbId: `${accountId}_${imdbId}`,
        accountId_targetState: `${accountId}_${targetState}`,
        nzbId,
        nzbTitle,
        nzbPubTs,
        nzbSize,
        imdbId,
        targetState,
      },
    })
  );
}

export async function scanAccounts(): Promise<Account[]> {
  const res = await dynamoDb.send(
    new ScanCommand({
      TableName: 'NzbAccount',
    })
  );

  return (res.Items ?? []) as Account[];
}

export async function updateNzbGetStatus(accountId: string, status: NzbGetStatus): Promise<void> {
  await dynamoDb.send(new PutCommand({TableName: 'NzbgetStatus', Item: {accountId, status}}));
}

export async function getNzbGetStatus(accountId: string): Promise<NzbGetStatus> {
  const res = await dynamoDb.send(new GetCommand({TableName: 'NzbgetStatus', Key: {accountId}}));
  return res.Item?.['status'] ?? {downloadRate: 0};
}

// export async function updateHealthTs(): Promise<void> {
//   const items = ((
//     await dynamoDb.send(
//       new QueryCommand({
//         TableName: 'Nzbsu',
//         IndexName: 'Nzbsu_ByHealthFailure_SortedByHealthTs',
//         KeyConditions: {
//           healthStatus: {ComparisonOperator: 'EQ', AttributeValueList: [HealthStatus.Unhealthy]},
//         },
//         ScanIndexForward: true,
//       })
//     )
//   ).Items ?? []) as NzbsuRegistryItem[];
//   for (const item of items) {
//     // eslint-disable-next-line no-await-in-loop
//     await dynamoDb.send(
//       new UpdateCommand({
//         TableName: 'Nzbsu',
//         Key: {guid: item.guid},
//         UpdateExpression: 'SET healthTs = :healthTs',
//         ExpressionAttributeValues: {
//           // eslint-disable-next-line @typescript-eslint/naming-convention
//           ':healthTs': Date.now(),
//         },
//       })
//     );
//   }
// }

//
// SCRIPTS
//

// export async function backfillAllHealthTs(): Promise<void> {
//   let lastEvaluatedKey: Record<string, any> | undefined;
//   while (true) {
//     // eslint-disable-next-line no-await-in-loop
//     const res = await dynamoDb.send(
//       new ScanCommand({
//         TableName: 'Nzbsu',
//         ExclusiveStartKey: lastEvaluatedKey,
//       })
//     );

//     let i = 0;
//     for (const item of res.Items ?? []) {
//       i++;
//       console.log(`${i}/${res.Items?.length}`, item.guid);
//       // eslint-disable-next-line no-await-in-loop
//       await dynamoDb.send(
//         new UpdateCommand({
//           TableName: 'Nzbsu',
//           Key: {guid: item.guid},
//           UpdateExpression: 'SET healthTs = :healthTs',
//           ExpressionAttributeValues: {
//             // eslint-disable-next-line @typescript-eslint/naming-convention
//             ':healthTs': item.pubTs,
//           },
//         })
//       );
//     }

//     lastEvaluatedKey = res.LastEvaluatedKey;
//     if (lastEvaluatedKey === undefined) {
//       break;
//     }
//   }
// }
/* eslint-enable @typescript-eslint/naming-convention */
