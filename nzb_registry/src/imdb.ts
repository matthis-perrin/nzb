import request from 'request';

import {asMapArrayOrThrow, asMapOrThrow, asStringOrThrow} from './type_utils';

const OK = 200;

const API_KEY = 'k_f72nc8j5';

export async function imdbSearch(fileName: string): Promise<unknown> {
  return new Promise<unknown>((resolve, reject) => {
    const url = `https://imdb-api.com/en/API/SearchMovie/${API_KEY}/${fileName.replaceAll(
      /[\s+]+/gu,
      '.'
    )}`;
    request.get({url}, (err: unknown, resp, body: unknown) => {
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      if (err) {
        reject(err);
      } else {
        if (resp.statusCode !== OK) {
          console.log(url, body);
          throw new Error('API_FAILURE');
        }
        resolve(JSON.parse(asStringOrThrow(body)));
      }
    });
  });
}

export function parseImdbSearch(res: unknown): {id: string; title: string} | undefined {
  try {
    const firstResult = asMapOrThrow(asMapArrayOrThrow(asMapOrThrow(res).results)[0]);
    return {
      id: asStringOrThrow(firstResult.id),
      title: asStringOrThrow(firstResult.title),
    };
  } catch {
    return undefined;
  }
}
