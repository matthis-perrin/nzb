import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {DynamoDBDocumentClient, GetCommand} from '@aws-sdk/lib-dynamodb';

import {NzbsuRegistryItem} from '../../shared/models';

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
