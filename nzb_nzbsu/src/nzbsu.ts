import request from 'request';

import {NZBSU_API_KEY} from '@shared/constant';
import {HealthStatus, NzbsuItem} from '@shared/models';
import {
  asMapArrayOrThrow,
  asMapOrThrow,
  asNumberOrThrow,
  asString,
  asStringOrThrow,
} from '@shared/type_utils';

export async function nzbsuGetJson(
  params: Record<string, string | number>
): Promise<NzbsuItem[] | undefined> {
  return new Promise<NzbsuItem[] | undefined>((resolve, reject) => {
    request.get(
      {
        url: `https://api.nzb.su/api`,
        qs: {...params, o: 'json', apikey: NZBSU_API_KEY},
        headers: {'User-Agent': 'nzb_nzbsu'},
      },
      (err: unknown, resp, body: unknown) => {
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        if (err) {
          reject(err);
        } else {
          try {
            const content = asStringOrThrow(body);
            if (content.includes('Request limit reached')) {
              console.log('Rate limited', content);
              resolve(undefined);
            }
            resolve(parseNzbsuRegistryItems(JSON.parse(content)));
          } catch (err: unknown) {
            reject(new Error(`Response is not a valid JSON (${String(err)}): "${body}"`));
          }
        }
      }
    );
  });
}

export function parseNzbsuRegistryItems(res: unknown): NzbsuItem[] {
  const items = asMapArrayOrThrow(asMapOrThrow(asMapOrThrow(res)['channel'])['item']);
  return items.map(item => {
    try {
      const attrsArr = asMapArrayOrThrow(item['attr']);
      const attrs = Object.fromEntries(
        attrsArr.map(rawAttr => {
          const attrInfo = asMapOrThrow(asMapOrThrow(rawAttr)['@attributes']);
          return [asStringOrThrow(attrInfo['name']), asStringOrThrow(attrInfo['value'])];
        })
      );
      const pubTs = new Date(asStringOrThrow(item['pubDate'])).getTime();
      return {
        guid: asStringOrThrow(attrs['guid']),
        title: asStringOrThrow(item['title']),
        size: asNumberOrThrow(attrs['size']),
        pubTs,
        imdbId: `tt${asString(attrs['imdb'], '0000000')}`,
        imdbTitle: asString(attrs['imdbtitle']),
        healthTs: pubTs,
        healthStatus: HealthStatus.Unknown,
        healthSuccess: 0,
        healthFailed: 0,
      };
    } catch (err: unknown) {
      console.log('Failure to parse item', JSON.stringify(item, undefined, 2));
      throw err;
    }
  });
}
