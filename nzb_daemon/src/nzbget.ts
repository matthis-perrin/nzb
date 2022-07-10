import {encode} from 'querystring';
import request from 'request';

import {NZBSU_API_KEY} from '../../shared/src/constant';
import {DownloadStatus, NzbGetStatus} from '../../shared/src/models';
import {
  AnyMap,
  asMapArrayOrThrow,
  asMapOrThrow,
  asNumberOrThrow,
  asString,
  asStringOrThrow,
  removeUndefined,
} from '../../shared/src/type_utils';

interface NzbGetConfig {
  dstDir: string;
}

const NZBGET_USERNAME = 'nzbget';
const NZBGET_PASSWORD = 'tegbzn6789';

const NZBGET_API_URL = `http://${NZBGET_USERNAME}:${NZBGET_PASSWORD}@127.0.0.1:6789/jsonrpc`;

export async function getConfig(): Promise<NzbGetConfig> {
  const config = Object.fromEntries(
    asMapArrayOrThrow(await rpc('config')).map(e => [e.Name, e.Value])
  );
  // console.log(await rpc('listgroups'));
  // console.log(await rpc('history'));
  const dstDir = asStringOrThrow(config['DestDir']);
  return {dstDir};
}

export async function getStatus(): Promise<NzbGetStatus> {
  const res = await rpc('status', []);
  const status = asMapOrThrow(res);
  const downloadRate = asNumberOrThrow(status.DownloadRate);
  return {downloadRate};
}

export async function startNzbDownload(nzbId: string): Promise<number> {
  const res = await rpc('append', [
    '' /* NZBFilename */,
    `https://api.nzb.su/api?${encode({
      t: 'get',
      id: nzbId,
      apikey: NZBSU_API_KEY,
    })}` /* Content */,
    '' /* Category */,
    0 /* Priority */,
    false /* AddToTop */,
    false /* AddPaused */,
    nzbId /* DupeKey */,
    0 /* DupeScore */,
    'SCORE' /* DupeMode */,
  ]);
  const queueNumber = asNumberOrThrow(res);
  if (queueNumber <= 0) {
    throw new Error(`Failure to start download for ${nzbId}`);
  }
  return queueNumber;
}

function parseDownloadStatus(item: AnyMap, inQueue: boolean): DownloadStatus & {nzbId: number} {
  const nzbId = asNumberOrThrow(item.NZBID);
  const fileSizeMb = asNumberOrThrow(item.FileSizeMB);
  const downloadedSizeMb = asNumberOrThrow(item.DownloadedSizeMB);
  const status = asStringOrThrow(item.Status);
  const path = asString(item.DestDir, '');
  return {fileSizeMb, downloadedSizeMb, status, path, inQueue, nzbId};
}

export async function getDownloadStatus(queueNumber: number): Promise<DownloadStatus> {
  async function statusInternal(
    command: string,
    params: unknown[],
    inQueue: boolean
  ): Promise<DownloadStatus[]> {
    const res = await rpc(command, params);
    const items = asMapArrayOrThrow(res);
    return removeUndefined(
      items.map(item => {
        const {nzbId, ...downloadStatus} = parseDownloadStatus(item, inQueue);
        if (nzbId !== queueNumber) {
          return undefined;
        }
        return downloadStatus;
      })
    );
  }

  const [fromQueue, fromHistory] = await Promise.all([
    statusInternal('listgroups', [0 /* NumberOfLogEntries */], true),
    statusInternal('history', [false /* Hidden */], false),
  ]);
  const downloadStatuses = [...fromQueue, ...fromHistory];
  if (downloadStatuses.length > 1) {
    throw new Error(
      `Multiple statuses for ${queueNumber}:\n${JSON.stringify(downloadStatuses, undefined, 2)}`
    );
  }
  const status = downloadStatuses[0];
  if (status === undefined) {
    throw new Error(`Failure to get download status for queueNumber ${queueNumber}`);
  }
  return status;
}

async function rpc(method: string, params: unknown[] = []): Promise<unknown> {
  return new Promise<unknown>((resolve, reject) => {
    request.post(
      String(NZBGET_API_URL),
      {body: JSON.stringify({jsonrpc: '2.0', method, params})},
      (err: unknown, resp, body: unknown) => {
        // eslint-disable-next-line no-null/no-null
        if (err !== null) {
          reject(err);
          return;
        }
        try {
          const response = asMapOrThrow(JSON.parse(asStringOrThrow(body)));
          if (response.error !== undefined) {
            throw new Error(asString(response.error.message, JSON.stringify(response.error)));
          }
          resolve(response.result);
        } catch (err: unknown) {
          reject(err);
        }
      }
    );
  });
}

export async function getDownloadStatusFromHistory(
  nzbId: string
): Promise<DownloadStatus | undefined> {
  const history = asMapArrayOrThrow(await rpc('history', [false /* Hidden */]));
  const item = history.find(h => h.DupeKey === nzbId && h.DestDir.length > 0);
  if (!item) {
    return undefined;
  }
  const {nzbId: discard, ...downloadStatus} = parseDownloadStatus(item, false);
  return downloadStatus;
}

export async function deleteHistory(nzbId: string): Promise<void> {
  const history = asMapArrayOrThrow(await rpc('history', [false /* Hidden */]));
  const items = history.filter(h => h.DupeKey === nzbId);
  await Promise.all(
    items.map(async item => rpc('editqueue', ['HistoryFinalDelete', '', [item.ID]]))
  );
}

// rpc('history', [false /* Hidden */]).then(console.log);
