import {checkNzb} from './nntp';
import {downloadNzb} from './nzb_download';

export async function waitFor(ms: number): Promise<void> {
  return new Promise<void>(resolve => {
    setTimeout(resolve, ms);
  });
}

export async function handler(): Promise<void> {
  const groups = await downloadNzb('a71edb3b6bcdd83c2c8cfe8741e8bf8e');
  console.log(await checkNzb(groups));
}

handler()
  .catch(console.error)
  .finally(() => {
    console.log('Done');
    // eslint-disable-next-line node/no-process-exit
    process.exit(0);
  });
