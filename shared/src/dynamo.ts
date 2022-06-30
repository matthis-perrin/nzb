import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

import {HealthStatus, ImdbNzbInfo, ImdbNzbInfoLight, NzbsuRegistryItem} from './models';
import {asMapArrayOrThrow, asMapOrThrow, asStringOrThrow} from './type_utils';

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({region: 'eu-west-3'}), {
  marshallOptions: {removeUndefinedValues: true},
});

const VERSION = '0';

export async function getNzbsuRegistryItem(guid: string): Promise<NzbsuRegistryItem | undefined> {
  const res = await dynamoDb.send(
    new GetCommand({
      TableName: 'NzbRegistry',
      Key: {guid},
    })
  );
  return res.Item as NzbsuRegistryItem | undefined;
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

export async function queryLastReleasedImdbInfoItem(limit: number): Promise<ImdbNzbInfoLight[]> {
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
  const res = await dynamoDb.send(
    new QueryCommand({
      TableName: 'ImdbInfo',
      IndexName: 'NzbRegistry_All_SortedByReleaseDate',
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

export async function insertNzbsuRegistryItems(items: NzbsuRegistryItem[]): Promise<void> {
  const MAX_PER_BATCH = 25;
  let index = 0;
  while (index < items.length) {
    const batch = items.slice(index, index + MAX_PER_BATCH);
    index += MAX_PER_BATCH;
    // eslint-disable-next-line no-await-in-loop
    await dynamoDb.send(
      new BatchWriteCommand({
        RequestItems: {
          NzbRegistry: batch.map(item => ({
            PutRequest: {
              Item: {...item, v: VERSION},
            },
          })),
        },
      })
    );
  }
}

export async function getLastNzbsuRegistryItem(): Promise<NzbsuRegistryItem> {
  const res = await dynamoDb.send(
    new QueryCommand({
      TableName: 'NzbRegistry',
      IndexName: 'NzbRegistry_All_SortedByPubTs',
      KeyConditions: {
        v: {ComparisonOperator: 'EQ', AttributeValueList: [VERSION]},
      },
      Limit: 1,
      ScanIndexForward: false,
    })
  );
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return asMapArrayOrThrow(res.Items)[0]! as NzbsuRegistryItem;
}

export async function queryNzbsuRegistryItemsByImdb(
  imdbId: string,
  limit: number
): Promise<NzbsuRegistryItem[]> {
  const res = await dynamoDb.send(
    new QueryCommand({
      TableName: 'NzbRegistry',
      IndexName: 'NzbRegistry_ByImdbId_SortedByPubTs',
      KeyConditions: {
        imdbId: {ComparisonOperator: 'EQ', AttributeValueList: [imdbId]},
      },
      Limit: limit,
      ScanIndexForward: false,
    })
  );
  return asMapArrayOrThrow(res.Items) as NzbsuRegistryItem[];
}

export async function queryNzbsuRegistryItemsBeforePubTs(
  pubTs: number,
  limit: number
): Promise<NzbsuRegistryItem[]> {
  const res = await dynamoDb.send(
    new QueryCommand({
      TableName: 'NzbRegistry',
      IndexName: 'NzbRegistry_All_SortedByPubTs',
      KeyConditions: {
        v: {ComparisonOperator: 'EQ', AttributeValueList: [VERSION]},
        pubTs: {ComparisonOperator: 'LE', AttributeValueList: [pubTs]},
      },
      Limit: limit,
      ScanIndexForward: false,
    })
  );
  return asMapArrayOrThrow(res.Items) as NzbsuRegistryItem[];
}

export async function updateNzbsuRegistryItemsWithImdbInfo(
  guid: string,
  id: string,
  title: string
): Promise<void> {
  await dynamoDb.send(
    new UpdateCommand({
      TableName: 'NzbRegistry',
      Key: {guid},
      UpdateExpression: 'SET imdbId = :id, imdbTitle = :title',
      ExpressionAttributeValues: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        ':id': id,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        ':title': title,
      },
    })
  );
}

export async function getParameters(): Promise<Record<string, string>> {
  const items = await dynamoDb.send(new ScanCommand({TableName: 'NzbParameters'}));
  return Object.fromEntries(
    (items.Items ?? []).map(item => [asStringOrThrow(item.key), asStringOrThrow(item.value)])
  );
}

export async function setParameter(key: string, value: string): Promise<void> {
  await dynamoDb.send(
    new UpdateCommand({
      TableName: 'NzbParameters',
      Key: {key},
      UpdateExpression: 'SET #value = :value',
      ExpressionAttributeValues: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        ':value': value,
      },
      ExpressionAttributeNames: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        '#value': 'value',
      },
    })
  );
}

export async function getNextNzbToCheck(): Promise<NzbsuRegistryItem | undefined> {
  const res = await dynamoDb.send(
    new QueryCommand({
      TableName: 'NzbRegistry',
      IndexName: 'NzbRegistry_ByHealthFailure_SortedByHealthTs',
      KeyConditions: {
        healthStatus: {ComparisonOperator: 'EQ', AttributeValueList: [HealthStatus.Unknown]},
      },
      Limit: 1,
      ScanIndexForward: true,
    })
  );
  return asMapOrThrow(res.Items?.[0]) as NzbsuRegistryItem;
}

export async function updateNzbsuRegistryItemsHealth(
  guid: string,
  healthStatus: string,
  healthFailed: number,
  healthSuccess: number
): Promise<void> {
  await dynamoDb.send(
    new UpdateCommand({
      TableName: 'NzbRegistry',
      Key: {guid},
      UpdateExpression:
        'SET healthStatus = :healthStatus, healthTs = :healthTs, healthFailed = :healthFailed, healthSuccess = :healthSuccess',
      ExpressionAttributeValues: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        ':healthStatus': healthStatus,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        ':healthTs': Date.now(),
        // eslint-disable-next-line @typescript-eslint/naming-convention
        ':healthFailed': healthFailed,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        ':healthSuccess': healthSuccess,
      },
    })
  );
}

// export async function updateHealthTs(): Promise<void> {
//   const items = ((
//     await dynamoDb.send(
//       new QueryCommand({
//         TableName: 'NzbRegistry',
//         IndexName: 'NzbRegistry_ByHealthFailure_SortedByHealthTs',
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
//         TableName: 'NzbRegistry',
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
//         TableName: 'NzbRegistry',
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
//           TableName: 'NzbRegistry',
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
