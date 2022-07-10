import {getNzbsuRegistryItem, insertNzbDaemonStatus} from '../../shared/src/dynamo';
import {asStringOrThrow} from '../../shared/src/type_utils';

export async function deleteDownload(
  body: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const accountId = asStringOrThrow(body.accountId);
  const nzbId = asStringOrThrow(body.nzbId);

  const nzb = await getNzbsuRegistryItem(nzbId);
  if (!nzb) {
    throw new Error(`Unknown nzb with id ${nzbId}`);
  }

  await insertNzbDaemonStatus(
    accountId,
    nzb.imdbId,
    nzbId,
    nzb.title,
    nzb.pubTs,
    nzb.size,
    'delete'
  );

  return {};
}
