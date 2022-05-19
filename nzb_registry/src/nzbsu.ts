import request from 'request';

import {NzbsuRegistryItem} from '../../shared/src/models';
import {
  asMapArrayOrThrow,
  asMapOrThrow,
  asNumberOrThrow,
  asString,
  asStringOrThrow,
} from '../../shared/src/type_utils';

const NZBSU_API_KEY = 'b8a81e890c29ccfda224075f1f8bd3aa';

export async function nzbsuGetJson(params: Record<string, string | number>): Promise<unknown> {
  return new Promise<unknown>((resolve, reject) => {
    request.get(
      {
        url: `https://api.nzb.su/api`,
        qs: {...params, o: 'json', apikey: NZBSU_API_KEY},
        headers: {'User-Agent': 'nzb_registry'},
      },
      (err: unknown, resp, body: unknown) => {
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        if (err) {
          reject(err);
        } else {
          resolve(JSON.parse(asStringOrThrow(body)));
        }
      }
    );
  });
}

export function parseNzbsuRegistryItems(res: unknown): NzbsuRegistryItem[] {
  const items = asMapArrayOrThrow(asMapOrThrow(asMapOrThrow(res).channel).item);
  return items.map(item => {
    try {
      const attrsArr = asMapArrayOrThrow(item.attr);
      const attrs = Object.fromEntries(
        attrsArr.map(rawAttr => {
          const attrInfo = asMapOrThrow(asMapOrThrow(rawAttr)['@attributes']);
          return [asStringOrThrow(attrInfo.name), asStringOrThrow(attrInfo.value)];
        })
      );
      return {
        guid: asStringOrThrow(attrs['guid']),
        title: asStringOrThrow(item['title']),
        size: asNumberOrThrow(attrs['size']),
        pubTs: new Date(asStringOrThrow(item['pubDate'])).getTime(),
        imdbId: `tt${asString(attrs['imdb'], '0000000')}`,
        imdbTitle: asString(attrs['imdbtitle']),
      };
    } catch (err: unknown) {
      console.log('Failure to parse item', JSON.stringify(item, undefined, 2));
      throw err;
    }
  });
}
