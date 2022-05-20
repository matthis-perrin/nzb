import {NO_IMDB_ID, NO_IMDB_MATCH_V3, UNKNOWN_IDS} from '../../shared/src/constant';
import {
  getImdbInfoItem,
  getNzbsuRegistryItem,
  getParameters,
  queryNzbsuRegistryItemsBeforePubTs,
  queryNzbsuRegistryItemsByImdb,
  setParameter,
  updateNzbsuRegistryItemsWithImdbInfo,
} from '../../shared/src/dynamo';
import {apiCallLeft, imdbSearch} from '../../shared/src/imdb';
import {NzbsuRegistryItem} from '../../shared/src/models';
import {sendItems} from '../../shared/src/sqs';
import {asStringOrThrow} from '../../shared/src/type_utils';

export async function waitFor(ms: number): Promise<void> {
  return new Promise<void>(resolve => {
    setTimeout(resolve, ms);
  });
}

export async function handler(): Promise<void> {
  let left = await apiCallLeft();
  console.log(`API call left: ${left}`);
  if (left <= 0) {
    return;
  }

  const itemsWithUnmatchedTitle = await queryNzbsuRegistryItemsByImdb(NO_IMDB_ID, 100);

  const parameters = await getParameters();
  const lastRegistryItemProcessed = asStringOrThrow(
    parameters.BACKFILL_LAST_REGISTRY_ITEM_PROCESSED
  );
  const lastProcessed = await getNzbsuRegistryItem(lastRegistryItemProcessed);
  if (lastProcessed === undefined) {
    throw new Error(`NzbRegistryItem with id "${lastRegistryItemProcessed}" not found`);
  }
  const beforeItems = await queryNzbsuRegistryItemsBeforePubTs(lastProcessed.pubTs, 100);
  const unprocessedItems = beforeItems.slice(
    beforeItems.findIndex(i => i.guid === lastRegistryItemProcessed) + 1
  );

  /* eslint-disable no-await-in-loop */
  while (left > 0 && (itemsWithUnmatchedTitle.length > 0 || unprocessedItems.length > 0)) {
    let toProcess: NzbsuRegistryItem | undefined;
    let toProcessType: 'title' | 'imdb' | undefined;

    const firstUnmatchedTitle = itemsWithUnmatchedTitle[0];
    const firstUnprocessed = unprocessedItems[0];
    if (firstUnmatchedTitle === undefined && firstUnprocessed === undefined) {
      console.error('Should never happen 1');
      break;
    } else if (firstUnmatchedTitle === undefined && firstUnprocessed !== undefined) {
      toProcess = firstUnprocessed;
      toProcessType = 'imdb';
    } else if (firstUnmatchedTitle !== undefined && firstUnprocessed === undefined) {
      toProcess = firstUnmatchedTitle;
      toProcessType = 'title';
    } else if (firstUnmatchedTitle !== undefined && firstUnprocessed !== undefined) {
      if (firstUnmatchedTitle.pubTs > firstUnprocessed.pubTs) {
        toProcess = firstUnmatchedTitle;
        toProcessType = 'title';
      } else {
        toProcess = firstUnprocessed;
        toProcessType = 'imdb';
      }
    }

    if (toProcess === undefined || toProcessType === undefined) {
      console.error('Should never happen 2');
      break;
    }

    console.log(
      `Processing ${toProcess.guid} with ${left} API call left - ${new Date(toProcess.pubTs)
        .toISOString()
        .slice(0, 10)} [${toProcessType}] "${toProcess.imdbTitle}"`
    );

    if (toProcessType === 'title') {
      left--;
      const imdbInfo = await imdbSearch(toProcess.title);
      if (!imdbInfo) {
        console.log('no match for', toProcess.title, toProcess.guid);
        await updateNzbsuRegistryItemsWithImdbInfo(toProcess.guid, NO_IMDB_MATCH_V3, '');
      } else {
        console.log(`${toProcess.guid} match "${imdbInfo.title}" (${imdbInfo.id})`);
        await updateNzbsuRegistryItemsWithImdbInfo(toProcess.guid, imdbInfo.id, imdbInfo.title);
      }
      itemsWithUnmatchedTitle.shift();
      await waitFor(2 * 1000);
    } else {
      if (UNKNOWN_IDS.includes(toProcess.imdbId)) {
        console.log(`Skipped ${toProcess.guid} "${toProcess.imdbId}"`);
      } else {
        const imdbInfo = await getImdbInfoItem(toProcess.imdbId);
        const cachedImdb = imdbInfo !== undefined;

        if (cachedImdb) {
          console.log('Already cached in ImdbInfo');
        } else {
          console.log('Sending to SQS and waiting');
          await sendItems([toProcess.guid]);
        }
        await waitFor(2 * 1000);
      }
      await setParameter('BACKFILL_LAST_REGISTRY_ITEM_PROCESSED', toProcess.guid);
      unprocessedItems.shift();
    }
  }
  /* eslint-enable no-await-in-loop */

  console.log(`Done`, {
    left,
    itemsWithUnmatchedTitleLeft: itemsWithUnmatchedTitle.length,
    unprocessedItemsLeft: unprocessedItems.length,
  });
}

handler().catch(console.error);
