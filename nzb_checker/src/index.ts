import {getNzbsuRegistryItem} from './dynamo';

interface SqsTriggerEvent {
  Records: {
    body: string;
  }[];
}

export async function handler(event: SqsTriggerEvent): Promise<void> {
  const message = event.Records[0]?.body;
  if (message === undefined || event.Records.length !== 1) {
    throw new Error(`Encountered SQS event with too many records: ${JSON.stringify(event)}`);
  }
  console.log(await getNzbsuRegistryItem(message));
}
