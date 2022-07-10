import {getNzbGetStatus, queryNzbDaemonStatusByTargetState} from '../../shared/src/dynamo';
import {asStringOrThrow} from '../../shared/src/type_utils';

export async function getState(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const accountId = asStringOrThrow(body.accountId);

  const [res1, res2, serverStatus] = await Promise.all([
    queryNzbDaemonStatusByTargetState(accountId, 'download'),
    queryNzbDaemonStatusByTargetState(accountId, 'force-download'),
    getNzbGetStatus(accountId),
  ]);

  return {items: [...res1, ...res2], serverStatus};
}
