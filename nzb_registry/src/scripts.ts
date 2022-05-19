import {NO_IMDB_MATCH_V3, UNKNOWN_IDS} from '../../shared/src/constant';
import {
  getImdbInfoItem,
  getNzbsuRegistryItem,
  queryNzbsuRegistryItemsBeforePubTs,
  queryNzbsuRegistryItemsByImdb,
  updateNzbsuRegistryItemsWithImdbInfo,
} from '../../shared/src/dynamo';
import {imdbSearch} from '../../shared/src/imdb';
import {sendItems} from './sqs';

export async function backFillImdbIds(id: string): Promise<void> {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // eslint-disable-next-line no-await-in-loop
    const toFetch = await queryNzbsuRegistryItemsByImdb(id, 10);
    if (toFetch.length === 0) {
      break;
    }
    for (const item of toFetch) {
      // eslint-disable-next-line no-await-in-loop
      const imdbInfo = await imdbSearch(item.title);
      if (!imdbInfo) {
        console.log('no match for', item.title, item.guid);
        // eslint-disable-next-line no-await-in-loop
        await updateNzbsuRegistryItemsWithImdbInfo(item.guid, NO_IMDB_MATCH_V3, '');
      } else {
        console.log(`${item.guid} match "${imdbInfo.title}" (${imdbInfo.id})`);
        // eslint-disable-next-line no-await-in-loop
        await updateNzbsuRegistryItemsWithImdbInfo(item.guid, imdbInfo.id, imdbInfo.title);
      }
    }
    console.log(new Date(toFetch.at(-1)?.pubTs ?? 0));
  }
}

export async function recheckNzbRegistryItems(): Promise<void> {
  const LAST_PROCESSED = 'cb8eeb61e3abe7051bc887624564a7ef';
  const lastProcessed = await getNzbsuRegistryItem(LAST_PROCESSED);
  if (lastProcessed === undefined) {
    throw new Error(`NzbRegistryItem with id "${LAST_PROCESSED}" not found`);
  }
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  const beforeItems = await queryNzbsuRegistryItemsBeforePubTs(lastProcessed.pubTs, 50);
  const toCheck = beforeItems.slice(beforeItems.findIndex(i => i.guid === LAST_PROCESSED) + 1);

  let query = 0;
  let cache = 0;
  let skipped = 0;

  for (const item of toCheck) {
    if (UNKNOWN_IDS.includes(item.imdbId)) {
      skipped++;
      console.log(`Skipped ${item.guid} "${item.imdbId}"`);
      continue;
    }

    // eslint-disable-next-line no-await-in-loop
    const imdbInfo = await getImdbInfoItem(item.imdbId);
    const cachedImdb = imdbInfo !== undefined;
    cache += cachedImdb ? 1 : 0;
    query += cachedImdb ? 0 : 1;
    const hitStr = cachedImdb ? 'CACHE' : 'QUERY';
    console.log(
      `Process ${item.guid} ${new Date(item.pubTs).toISOString().slice(0, 10)} ${hitStr} "${
        item.imdbTitle
      }"`
    );

    // eslint-disable-next-line no-await-in-loop
    await sendItems([item.guid]);

    // eslint-disable-next-line no-await-in-loop
    await (async () =>
      new Promise<void>(resolve => {
        setTimeout(resolve, (cachedImdb ? 1 : 10) * 1000);
      }))();
  }
  console.log({query, cache, skipped});
  console.log('Last processed', toCheck.at(-1)?.guid);
}

export function recurseFn(fn: () => Promise<void>): void {
  fn()
    .catch(console.error)
    .finally(() => {
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      setTimeout(() => recurseFn(fn), 5000);
    });
}
