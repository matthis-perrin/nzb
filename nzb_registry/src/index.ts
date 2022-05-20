import {NO_IMDB_ID, NO_IMDB_MATCH_V3, UNKNOWN_IDS} from '../../shared/src/constant';
import {getLastNzbsuRegistryItem, insertNzbsuRegistryItems} from '../../shared/src/dynamo';
import {imdbSearch} from '../../shared/src/imdb';
import {NzbsuRegistryItem} from '../../shared/src/models';
import {sendItems} from '../../shared/src/sqs';
import {nzbsuGetJson, parseNzbsuRegistryItems} from './nzbsu';
// import {backFillImdbIds, recurseFn} from './scripts';

async function fetchNzbsuRegistryItemsUntilGuid(guid: string): Promise<NzbsuRegistryItem[]> {
  let offset = 0;
  const allItems: NzbsuRegistryItem[] = [];

  // eslint-disable-next-line no-constant-condition
  while (true) {
    // eslint-disable-next-line no-await-in-loop
    const res = await nzbsuGetJson({
      t: 'movie',
      cat: '2045',
      offset,
      attrs: ['guid', 'imdb', 'imdbtitle'].join(','),
    });
    const items = parseNzbsuRegistryItems(res);
    offset += items.length;
    if (items.length === 0) {
      break;
    }
    const targetItemIndex = items.findIndex(item => item.guid === guid);
    if (targetItemIndex !== -1) {
      allItems.push(...items.slice(0, targetItemIndex));
      break;
    }
    allItems.push(...items);
  }

  return allItems;
}

export async function handler(): Promise<void> {
  const lastItem = await getLastNzbsuRegistryItem();
  console.log(`Last item: ${lastItem.guid}`);
  const newItems = await fetchNzbsuRegistryItemsUntilGuid(lastItem.guid);
  console.log(`${newItems.length} new item(s)`);
  const itemsWithImdb = await Promise.all(
    newItems.map(async item => {
      if (item.imdbId !== NO_IMDB_ID) {
        return item;
      }
      console.log(`Fetching imdb info for "${item.title}" (${item.guid})`);
      try {
        const imdbInfo = await imdbSearch(item.title);
        if (!imdbInfo) {
          console.log('no match for ', item.title);
          return {...item, imdbId: NO_IMDB_MATCH_V3, imdbTitle: ''};
        }
        console.log(`match "${imdbInfo.title}" (${imdbInfo.id})`);
        return {...item, imdbId: imdbInfo.id, imdbTitle: imdbInfo.title};
      } catch (err: unknown) {
        console.log(err);
        return item;
      }
    })
  );
  const items = itemsWithImdb.reverse();
  await insertNzbsuRegistryItems(items);

  const sqsItems = items.filter(item => !UNKNOWN_IDS.includes(item.imdbId)).map(item => item.guid);
  if (sqsItems.length > 0) {
    try {
      await sendItems(sqsItems);
    } catch (err: unknown) {
      console.log('Failure while sending to SQS');
      console.log(JSON.stringify(items, undefined, 2));
      throw err;
    }
  }
  console.log('Done');
}

// recheckNzbRegistryItems();
// backFillImdbIds(NO_IMDB_MATCH_V2);
