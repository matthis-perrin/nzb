import request from 'request';

import {asMapArrayOrThrow, asMapOrThrow, asStringOrThrow} from './type_utils';

const OK = 200;

const API_KEY = 'k_udmpb1il';

export async function imdbSearch(fileName: string): Promise<ImdbSearch | undefined> {
  let simplerFileName = fileName.match(/^.*?(?:2160|19\d{2}|20[0-2]\d)/gu)?.[0];
  if (simplerFileName === undefined) {
    return imdbSearchApiCall(fileName);
  }
  if (simplerFileName.endsWith('2160')) {
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    simplerFileName = simplerFileName.slice(0, -4);
  }
  return imdbSearchApiCall(simplerFileName);
}

interface ImdbSearch {
  id: string;
  title: string;
}

async function imdbSearchApiCall(fileName: string): Promise<ImdbSearch | undefined> {
  return new Promise<ImdbSearch | undefined>((resolve, reject) => {
    const url = `https://imdb-api.com/en/API/SearchMovie/${API_KEY}/${fileName.replace(
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
          throw new Error(`API_FAILURE (${resp.statusCode})`);
        }
        resolve(parseImdbSearch(JSON.parse(asStringOrThrow(body))));
      }
    });
  });
}

function parseImdbSearch(res: unknown): ImdbSearch | undefined {
  const json = asMapOrThrow(res);
  if (typeof json.errorMessage === 'string' && json.errorMessage.length > 0) {
    throw new Error(`API error "${json.errorMessage}"`);
  }
  try {
    const firstResult = asMapOrThrow(asMapArrayOrThrow(json.results)[0]);
    return {
      id: asStringOrThrow(firstResult.id),
      title: asStringOrThrow(firstResult.title),
    };
  } catch {
    return undefined;
  }
}
