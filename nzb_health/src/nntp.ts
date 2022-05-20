import {NntpConnection} from 'nntp-fast';

import {
  NEWSHOSTING_PASSWORD,
  NEWSHOSTING_PORT,
  NEWSHOSTING_SERVER,
  NEWSHOSTING_USERNAME,
} from '../../shared/src/constant';
import {asMap, asNumber} from '../../shared/src/type_utils';

const CONNECTION = 100;

export async function checkNzb(
  segments: string[]
): Promise<{total: number; success: number; failure: number}> {
  let failure = 0;
  let success = 0;
  let index = 0;

  await Promise.all(
    [...new Array(CONNECTION)].map(async () => {
      const conn = new NntpConnection();
      await conn.connect(NEWSHOSTING_SERVER, NEWSHOSTING_PORT);

      await conn.runCommand(`AUTHINFO USER ${NEWSHOSTING_USERNAME}`);
      await conn.runCommand(`AUTHINFO PASS ${NEWSHOSTING_PASSWORD}`);

      while (index < segments.length) {
        const segment = segments[index];
        index++;
        try {
          const res = await conn.head(`<${segment}>`);
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          if (res.code === 221) {
            success++;
          } else {
            console.log('failure');
            failure++;
          }
        } catch (err: unknown) {
          const code = asNumber(asMap(err)?.code);
          if (code === undefined) {
            console.log('throw');
            throw err;
          } else {
            console.log('failure');
            failure++;
          }
        }
      }

      await conn.runCommand('QUIT');
    })
  );

  return {total: segments.length, success, failure};
}
