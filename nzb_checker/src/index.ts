import {
  ChangeMessageVisibilityCommand,
  DeleteMessageCommand,
  GetQueueUrlCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';

import {UNKNOWN_IDS} from '../../shared/constant';
import {getImdbInfoItem, getNzbsuRegistryItem, putImdbInfoItem} from './dynamo';
import {imdbInfo, parseImdbInfo} from './imdb';

interface SqsTriggerEvent {
  Records: {
    receiptHandle: string;
    body: string;
  }[];
}

const sqs = new SQSClient({region: 'eu-west-3'});

export async function handler(event: SqsTriggerEvent): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, unicorn/no-await-expression-member
  const queueUrl = (await sqs.send(new GetQueueUrlCommand({QueueName: 'NzbToCheck'}))).QueueUrl!;

  const {body: guid, receiptHandle} = event.Records[0] ?? {};
  if (guid === undefined || event.Records.length !== 1) {
    throw new Error(`Encountered SQS event with too many records: ${JSON.stringify(event)}`);
  }
  console.log(`GUID ${guid}`);

  async function fail(err: unknown): Promise<never> {
    await sqs.send(new DeleteMessageCommand({QueueUrl: queueUrl, ReceiptHandle: receiptHandle}));
    throw err;
  }

  async function retryLater(err: unknown): Promise<never> {
    await sqs.send(
      new ChangeMessageVisibilityCommand({
        QueueUrl: queueUrl,
        ReceiptHandle: receiptHandle,
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        VisibilityTimeout: (12 * 60 - 1) * 60,
      })
    );
    throw err;
  }

  const nzbItem = await getNzbsuRegistryItem(guid);
  if (nzbItem === undefined) {
    return fail(new Error(`No NzbsuRegistryItem with id "${guid}" in DB`));
  }

  const {imdbId, title, pubTs, size} = nzbItem;
  console.log(`Processing imdbId ${imdbId} "${title}"`);
  if (UNKNOWN_IDS.includes(imdbId)) {
    return fail(
      new Error(`Encountered NzbsuRegistryItem (id: "${guid}", title: "${title}") with no imdbId`)
    );
  }

  const imdbItem = await getImdbInfoItem(imdbId);
  if (imdbItem === undefined) {
    try {
      const info = parseImdbInfo(await imdbInfo(imdbId));
      await putImdbInfoItem({
        ...info,
        bestNzbId: guid,
        bestNzbTitle: title,
        bestNzbDate: pubTs,
        bestNzbSize: size,
      });
    } catch (err: unknown) {
      await retryLater(err);
    }
  } else if (imdbItem.bestNzbSize < size) {
    await putImdbInfoItem({
      ...imdbItem,
      bestNzbId: guid,
      bestNzbTitle: title,
      bestNzbDate: pubTs,
      bestNzbSize: size,
    });
  }
}
