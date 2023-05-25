import {
  ChangeMessageVisibilityCommand,
  DeleteMessageCommand,
  GetQueueUrlCommand,
  SQSClient,
} from '@aws-sdk/client-sqs';

import {NO_IMDB_MATCH_V4, UNKNOWN_IDS} from '@shared/constant';
import {
  getNzbsuItem,
  getTmdbMovieItem,
  putTmdbMovieItem,
  putTmdbTvShowItem,
  updateNzbsuItemsWithImdbInfo,
  updateTmdbBestNzb,
} from '@shared/dynamo';
import {openSubtitlesSearch} from '@shared/opensubtitles_api';
import {getTmdbInfoFromApi} from '@shared/tmdb_api';

interface SqsTriggerEvent {
  Records: {
    receiptHandle: string;
    body: string;
  }[];
}

const sqs = new SQSClient({region: 'eu-west-3'});

export async function handler(event: SqsTriggerEvent): Promise<void> {
  const {body: guid, receiptHandle} = event.Records[0] ?? {};
  console.log(`GUID ${guid}`);

  // Retrieve the guid of the nzb to check
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, unicorn/no-await-expression-member
  const queueUrl = (await sqs.send(new GetQueueUrlCommand({QueueName: 'NzbToCheck'}))).QueueUrl!;
  if (guid === undefined || event.Records.length !== 1) {
    throw new Error(`Encountered SQS event with too many records: ${JSON.stringify(event)}`);
  }

  // Prepare some lifecycle function in case something goes wrong
  async function fail(err: unknown): Promise<void> {
    await sqs.send(new DeleteMessageCommand({QueueUrl: queueUrl, ReceiptHandle: receiptHandle}));
    console.error(err);
  }

  async function retryLater(err?: unknown): Promise<void> {
    await sqs.send(
      new ChangeMessageVisibilityCommand({
        QueueUrl: queueUrl,
        ReceiptHandle: receiptHandle,
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        VisibilityTimeout: (12 * 60 - 1) * 60, // 11h59minx`
      })
    );
    if (err !== undefined) {
      console.error(err);
    }
  }

  // Get the item associated in DB
  const nzbItem = await getNzbsuItem(guid);
  if (nzbItem === undefined) {
    return fail(new Error(`No NzbsuRegistryItem with id "${guid}" in DB`));
  }

  // If the imdb id is unknown, we call open subtitle to retrieve it from the file name
  const {imdbId: maybeImdbId, title, pubTs, size} = nzbItem;
  let imdbId = maybeImdbId;
  let shouldUpdateImdbId = false;
  console.log(`Processing imdbId ${imdbId} "${title}"`);
  if (imdbId === NO_IMDB_MATCH_V4) {
    return fail(`Item already processed`);
  }
  if (UNKNOWN_IDS.includes(imdbId)) {
    console.log('No imdbId, searching.');
    const searchRes = await openSubtitlesSearch(title);
    if (searchRes === undefined) {
      console.log('No match');
      await updateNzbsuItemsWithImdbInfo(guid, NO_IMDB_MATCH_V4, '');
      return retryLater();
    }
    console.log('Identified', searchRes);
    shouldUpdateImdbId = true;
    imdbId = searchRes;
  }

  // Get the tmdb movie in DB
  const tmdbItem = await getTmdbMovieItem(imdbId);
  if (tmdbItem === undefined) {
    try {
      console.log('No tmdb info, fetching...');
      const res = await getTmdbInfoFromApi(imdbId);
      if ('tmdbMovie' in res) {
        const {tmdbMovie} = res;
        console.log(`Fetched movie "${tmdbMovie.title}"`);
        await putTmdbMovieItem({
          ...tmdbMovie,
          bestNzbId: guid,
          bestNzbTitle: title,
          bestNzbDate: pubTs,
          bestNzbSize: size,
        });
        if (shouldUpdateImdbId) {
          await updateNzbsuItemsWithImdbInfo(guid, imdbId, tmdbMovie.title);
        }
      } else {
        const {tmdbTvShow} = res;
        console.log(`Fetched tv-show "${tmdbTvShow.name}"`);
        await putTmdbTvShowItem({...tmdbTvShow, imdb_id: imdbId});
        if (shouldUpdateImdbId) {
          await updateNzbsuItemsWithImdbInfo(guid, imdbId, tmdbTvShow.name);
        }
      }
    } catch (err: unknown) {
      return retryLater(err);
    }
  } else if (tmdbItem.bestNzbSize < size) {
    console.log('File is bigger, updating bestNzb');
    await updateTmdbBestNzb(tmdbItem.id, nzbItem);
    if (shouldUpdateImdbId) {
      await updateNzbsuItemsWithImdbInfo(guid, imdbId, tmdbItem.title);
    }
  }
}
