import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {DynamoDBDocumentClient, GetCommand, PutCommand} from '@aws-sdk/lib-dynamodb';

import {ImdbNzbInfo, NzbsuRegistryItem} from '../../shared/models';

const VERSION = '0';

const dynamoDb = DynamoDBDocumentClient.from(new DynamoDBClient({region: 'eu-west-3'}), {
  marshallOptions: {removeUndefinedValues: true},
});

export async function getNzbsuRegistryItem(guid: string): Promise<NzbsuRegistryItem | undefined> {
  const res = await dynamoDb.send(
    new GetCommand({
      TableName: 'NzbRegistry',
      Key: {
        guid,
      },
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
