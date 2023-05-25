import {NO_IMDB_ID} from '@shared/constant';
import {
  deleteNzbsuItem,
  getLastNzbsuItem,
  getTmdbMovieItem,
  getTmdbTvShowItem,
  insertNzbsuItem,
  updateTmdbBestNzb,
} from '@shared/dynamo';
import {NzbsuItem} from '@shared/models';
import {sendItems} from '@shared/sqs';

import {nzbsuGetJson} from '@src/nzbsu';

export async function handler(): Promise<void> {
  // const content = await readFile('./items.txt');
  // const items = content
  //   .toString()
  //   .trim()
  //   .split('\n')
  //   .map(item => JSON.parse(item) as NzbsuItem);
  // items.sort((i1, i2) => i1.pubTs - i2.pubTs);

  // let i = 0;
  // let inserted = 0;
  // const batchSize = 100;
  // for (const chunk of chunkArray(items, batchSize)) {
  //   const chunkIds = chunk.map(item => item.guid);
  //   const dbItems = await batchGetNzbsuItem(chunkIds);
  //   for (const item of chunk) {
  //     const dbItem = dbItems[item.guid];
  //     if (dbItem === undefined) {
  //       await insertNzbsuItem(item);
  //       inserted++;
  //     }
  //   }
  //   for (const chunkSqs of chunkArray(chunkIds, 10)) {
  //     await sendItems(chunkSqs);
  //   }
  //   i += batchSize;
  //   appendFileSync('progress', `[${new Date().toString()}] ${i} ${inserted}` + '\n');
  // }

  // Get the most recent NZB we have in DB
  const lastItem = await getLastNzbsuItem();
  console.log(`Last item: ${lastItem.guid}`);

  // Get all the new NZB from NZB.su
  const newItems = await fetchNzbsuRegistryItemsUntiItem(lastItem);

  if (!newItems) {
    console.log('Failed to fetchNzbsuRegistryItemsUntilGuid, exiting early');
    return;
  }

  // Sort by oldest first (smaller pubTs) and process item one by one.
  // This way if something fails in the middle of the process we
  // can re-run the lambda and `getLastNzbsuRegistryItem` will return something coherent
  newItems.sort((item1, item2) => item1.pubTs - item2.pubTs);

  console.log(`${newItems.length} new item(s)`);

  /* eslint-disable no-await-in-loop */
  for (const item of newItems) {
    // Create the NZB in DB
    console.log('inserting', item);
    await insertNzbsuItem(item);
    try {
      // Check if we have an IMDB id
      if (item.imdbId !== NO_IMDB_ID) {
        // Get the movie info
        console.log('get imdb info in db');
        const tmdbMovie = await getTmdbMovieItem(item.imdbId);
        if (tmdbMovie) {
          // If this new NZB is larger than our current best, we update in DB
          if (tmdbMovie.bestNzbSize < item.size) {
            console.log('update because better');
            await updateTmdbBestNzb(tmdbMovie.id, item);
          }
          continue;
        }

        // If we don't have a movie info, check if it's a tv show
        const tmdbTvShow = await getTmdbTvShowItem(item.imdbId);
        if (tmdbTvShow) {
          continue;
        }
      }
      // If we arrive here, we were not able to identify the imdb info associated with this NZB.
      // This will require more processing and will be done in another lambda
      console.log('send to SQS for post processing');
      await sendItems([item.guid]);
    } catch (err: unknown) {
      // Something went wrong, we revert the write and stop everything
      console.error(`Failure to process item ${item.guid}`, item, err);
      await deleteNzbsuItem(item.guid);
      break;
    }
  }
  /* eslint-enable no-await-in-loop */
  console.log('Done');
}

// Call NZB.su API to retrieve all NZB published more recently than a specific guid
// We basically fetch all the NZB sorted by most recent first and stop once we encounter the guid
// of the item or reach a pubTs older.
async function fetchNzbsuRegistryItemsUntiItem(
  targetItem: NzbsuItem
): Promise<NzbsuItem[] | undefined> {
  let offset = 0;
  const allItems: NzbsuItem[] = [];

  while (true) {
    // eslint-disable-next-line no-await-in-loop
    const items = await nzbsuGetJson({
      t: 'movie',
      cat: '2045',
      offset,
      attrs: ['guid', 'imdb', 'imdbtitle'].join(','),
    });
    if (!items) {
      return undefined;
    }
    offset += items.length;
    if (items.length === 0) {
      break;
    }
    const targetItemIndex = items.findIndex(
      item => item.guid === targetItem.guid || item.pubTs < targetItem.pubTs
    );
    if (targetItemIndex !== -1) {
      allItems.push(...items.slice(0, targetItemIndex));
      break;
    }
    allItems.push(...items);
  }

  return allItems;
}
