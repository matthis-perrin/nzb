import request from 'request';

import {asMapArrayOrThrow, asMapOrThrow, asNumber, asStringOrThrow} from '@shared/type_utils';

const OPEN_SUBTITLE_API_KEY = 'vuPOHXCSUBW8cfX5nAbdlVeBMI2PDTX4';
const OK = 200;

export async function openSubtitlesSearch(query: string): Promise<string | undefined> {
  let normalizedQuery = query;
  normalizedQuery = normalizedQuery.replace(/[àáâãäå]/gu, 'a');
  normalizedQuery = normalizedQuery.replace(/æ/gu, 'ae');
  normalizedQuery = normalizedQuery.replace(/ç/gu, 'c');
  normalizedQuery = normalizedQuery.replace(/[èéêë]/gu, 'e');
  normalizedQuery = normalizedQuery.replace(/[ìíîï]/gu, 'i');
  normalizedQuery = normalizedQuery.replace(/ñ/gu, 'n');
  normalizedQuery = normalizedQuery.replace(/[òóôõö]/gu, 'o');
  normalizedQuery = normalizedQuery.replace(/œ/gu, 'oe');
  normalizedQuery = normalizedQuery.replace(/[ùúûü]/gu, 'u');
  normalizedQuery = normalizedQuery.replace(/[ýÿ]/gu, 'y');
  // eslint-disable-next-line no-control-regex
  normalizedQuery = normalizedQuery.replace(/[^\u0000-\u007F]/gu, '');

  console.log(`Search for title "${normalizedQuery}"`);

  return new Promise<string | undefined>((resolve, reject) => {
    const url = `https://api.opensubtitles.com/api/v1/subtitles?query=${encodeURIComponent(
      normalizedQuery
    )}`;
    request.get(
      {url, headers: {'Content-Type': 'application/json', 'Api-Key': OPEN_SUBTITLE_API_KEY}},
      (err: unknown, resp, body: unknown) => {
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        if (err) {
          reject(err);
        } else {
          if (resp.statusCode !== OK) {
            console.log(resp.statusCode, url, body);
            throw new Error(`OpenSubtitles API failure (search): ${body}`);
          }
          // Parse results
          const res = asMapArrayOrThrow(asMapOrThrow(JSON.parse(asStringOrThrow(body)))['data']);
          const imdbIds = res.map(r =>
            asNumber(asMapOrThrow(asMapOrThrow(r['attributes'])['feature_details'])['imdb_id'])
          );
          const [id1, id2, id3] = imdbIds;
          if (id1 !== undefined && id1 === id2 && id2 === id3) {
            resolve(`tt${id1}`);
          } else {
            console.log(`Failure to identify from title (${JSON.stringify(imdbIds)})`);
            resolve(undefined);
          }
        }
      }
    );
  });
}
