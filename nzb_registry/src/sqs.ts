import {GetQueueUrlCommand, SendMessageBatchCommand, SQSClient} from '@aws-sdk/client-sqs';

const sqs = new SQSClient({region: 'eu-west-3'});

let queueUrl: string | undefined;

async function getQueueUrl(): Promise<string> {
  if (queueUrl !== undefined) {
    return queueUrl;
  }
  const queueUrlRes = await sqs.send(new GetQueueUrlCommand({QueueName: 'NzbToCheck'}));
  return queueUrlRes.QueueUrl!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
}

export async function sendItems(guids: string[]): Promise<void> {
  const queueUrl = await getQueueUrl();
  await sqs.send(
    new SendMessageBatchCommand({
      QueueUrl: queueUrl,
      Entries: guids.map(id => ({
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        Id: Math.random().toString(36).slice(2),
        MessageBody: id,
      })),
    })
  );
}
