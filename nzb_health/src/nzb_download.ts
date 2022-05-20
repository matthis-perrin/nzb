import {XMLParser} from 'fast-xml-parser';
import request from 'request';

import {NZBSU_API_KEY} from '../../shared/src/constant';
import {
  asMapArrayOrThrow,
  asMapOrThrow,
  asStringArray,
  asStringOrThrow,
} from '../../shared/src/type_utils';

export async function downloadNzb(id: string): Promise<string[]> {
  return new Promise<string[]>((resolve, reject) => {
    request.get(
      {
        url: `https://api.nzb.su/api`,
        qs: {t: 'get', id, apikey: NZBSU_API_KEY},
        headers: {'User-Agent': 'nzb_registry'},
      },
      (err: unknown, resp, body: unknown) => {
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        if (err) {
          reject(err);
        } else {
          resolve(parseNzb(asStringOrThrow(body)));
        }
      }
    );
  });
}

function parseNzb(file: string): string[] {
  const parser = new XMLParser();
  const parsed = parser.parse(file);

  const files = asMapArrayOrThrow(asMapOrThrow(asMapOrThrow(parsed).nzb).file);
  const segments = files.flatMap(file => {
    const rawSegments = asMapOrThrow(asMapOrThrow(file).segments).segment;
    if (typeof rawSegments === 'string') {
      return [rawSegments];
    }

    const segments = asStringArray(rawSegments);
    if (segments === undefined) {
      console.log(rawSegments);
      throw new Error('segment is not a string or an array of strings');
    }
    return segments;
  });

  return segments;
}
