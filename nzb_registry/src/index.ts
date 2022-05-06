import {
  getLastNzbsuRegistryItems,
  insertNzbsuRegistryItems,
  // queryNzbsuRegistryItemsWithoutImdb,
  // updateNzbsuRegistryItemsWithImdbInfo,
} from './dynamo';
import {imdbSearch, parseImdbSearch} from './imdb';
import {NzbsuRegistryItem} from './models';
import {nzbsuGetJson, parseNzbsuRegistryItems} from './nzbsu';

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
  const lastItem = await getLastNzbsuRegistryItems();
  console.log(`Last item: ${lastItem.guid}`);
  const newItems = await fetchNzbsuRegistryItemsUntilGuid(lastItem.guid);
  console.log(`${newItems.length} new item(s)`);
  const itemsWithImdb = await Promise.all(
    newItems.map(async item => {
      if (item.imdbId !== 'tt0000000') {
        return item;
      }
      console.log(`Fetching imdb info for "${item.title}" (${item.guid})`);
      try {
        const imdbInfo = parseImdbSearch(await imdbSearch(item.title));
        if (!imdbInfo) {
          console.log('no match');
          return {...item, imdbId: 'no_match', imdbTitle: ''};
        }
        console.log(`match "${imdbInfo.title}" (${imdbInfo.id})`);
        return {...item, imdbId: imdbInfo.id, imdbTitle: imdbInfo.title};
      } catch {
        return item;
      }
    })
  );
  await insertNzbsuRegistryItems(itemsWithImdb.reverse());
  console.log('Done');
}

// async function test(): Promise<void> {
//   // eslint-disable-next-line no-constant-condition
//   while (true) {
//     // eslint-disable-next-line no-await-in-loop
//     const toFetch = await queryNzbsuRegistryItemsWithoutImdb();
//     if (toFetch.length === 0) {
//       break;
//     }
//     for (const item of toFetch) {
//       // eslint-disable-next-line no-await-in-loop
//       const imdbInfo = parseImdbSearch(await imdbSearch(item.title));
//       if (!imdbInfo) {
//         console.log('no match for', item.title, item.guid);
//         // eslint-disable-next-line no-await-in-loop
//         await updateNzbsuRegistryItemsWithImdbInfo(item.guid, 'no_match', '');
//       } else {
//         console.log(`match "${imdbInfo.title}" (${imdbInfo.id})`);
//         // eslint-disable-next-line no-await-in-loop
//         await updateNzbsuRegistryItemsWithImdbInfo(item.guid, imdbInfo.id, imdbInfo.title);
//       }
//     }
//     console.log(new Date(toFetch.at(-1)?.pubTs ?? 0));
//   }
// }

// function recurse(): void {
//   test()
//     .catch(console.error)
//     .finally(() => {
//       // eslint-disable-next-line @typescript-eslint/no-magic-numbers
//       setTimeout(recurse, 5000);
//     });
// }
// recurse();
