import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {
  BatchWriteCommand,
  DynamoDBDocumentClient,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';

import {NzbsuRegistryItem} from '../../shared/models';
import {asMapArrayOrThrow} from './type_utils';

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({region: 'eu-west-3'}), {
  marshallOptions: {removeUndefinedValues: true},
});

const VERSION = '0';

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

export async function getLastNzbsuRegistryItems(): Promise<NzbsuRegistryItem> {
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

export async function queryNzbsuRegistryItemsWithoutImdb(): Promise<NzbsuRegistryItem[]> {
  const res = await dynamoDb.send(
    new QueryCommand({
      TableName: 'NzbRegistry',
      IndexName: 'NzbRegistry_ByImdbId_SortedByPubTs',
      KeyConditions: {
        imdbId: {ComparisonOperator: 'EQ', AttributeValueList: ['tt0000000']},
      },
      Limit: 10,
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
