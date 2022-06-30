import {getNextNzbToCheck, updateNzbsuRegistryItemsHealth} from '../../shared/src/dynamo';
import {HealthStatus} from '../../shared/src/models';
import {checkNzb} from './nntp';
import {downloadNzb} from './nzb_download';

export async function waitFor(ms: number): Promise<void> {
  return new Promise<void>(resolve => {
    setTimeout(resolve, ms);
  });
}

export async function handler(): Promise<void> {
  while (true) {
    const item = await getNextNzbToCheck();
    if (item === undefined) {
      throw new Error('No more');
    }
    console.log(item);
    const groups = await downloadNzb(item.guid);
    const {success, failure} = await checkNzb(groups);
    const status = failure > 0 ? HealthStatus.Unhealthy : HealthStatus.Healthy;
    console.log(status, success, failure);
    await updateNzbsuRegistryItemsHealth(item.guid, status, failure, success);
    await waitFor(1000);
  }
}

// handler()
//   .catch(console.error)
//   .finally(() => {
//     console.log('Done');
//     // eslint-disable-next-line node/no-process-exit
//     process.exit(0);
//   });
