import {updateNzbDaemonStatusDownloadStatus, updateNzbGetStatus} from '../../shared/src/dynamo';
import {DownloadStatus, NzbGetStatus} from '../../shared/src/models';
import {asMap, asMapOrThrow, asStringOrThrow} from '../../shared/src/type_utils';

export async function updateDownloadStatus(
  body: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const accountId = asStringOrThrow(body.accountId);
  const nzbId = asStringOrThrow(body.nzbId);
  const downloadStatus = asMap(body.downloadStatus) as DownloadStatus | undefined;
  const serverStatus = asMapOrThrow(body.serverStatus) as NzbGetStatus;

  await Promise.all([
    updateNzbDaemonStatusDownloadStatus(accountId, nzbId, downloadStatus),
    updateNzbGetStatus(accountId, serverStatus),
  ]);

  return {};
}
