import {updateNzbDaemonStatusDownloadStatus} from '../../shared/src/dynamo';
import {DownloadStatus} from '../../shared/src/models';
import {asMapOrThrow, asStringOrThrow} from '../../shared/src/type_utils';

export async function updateDownloadStatus(
  body: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const accountId = asStringOrThrow(body.accountId);
  const nzbId = asStringOrThrow(body.nzbId);
  const downloadStatus = asMapOrThrow(body.downloadStatus) as DownloadStatus;

  await updateNzbDaemonStatusDownloadStatus(accountId, nzbId, downloadStatus);

  return {};
}
