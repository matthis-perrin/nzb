import {rm} from 'fs/promises';
import request from 'request';

import {API_DOMAIN} from '../../shared/src/constant';
import {DownloadStatus, NzbDaemonStatus} from '../../shared/src/models';
import {asStringOrThrow} from '../../shared/src/type_utils';
import {initDb} from './db';
import {
  deleteHistory,
  getConfig,
  getDownloadStatus,
  getDownloadStatusFromHistory,
  getStatus,
  startNzbDownload,
} from './nzbget';

const ACCOUNT_ID = 'matthis';

async function getTargetState(): Promise<NzbDaemonStatus[]> {
  return new Promise<NzbDaemonStatus[]>((resolve, reject) => {
    request.post(
      `${API_DOMAIN}/get-state`,
      {body: JSON.stringify({accountId: ACCOUNT_ID})},
      (err: unknown, resp, body: unknown) => {
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        if (err) {
          reject(err);
        } else {
          const targetState = JSON.parse(asStringOrThrow(body)).items as NzbDaemonStatus[];
          resolve(targetState);
        }
      }
    );
  });
}

async function updateState(nzbId: string, downloadStatus?: DownloadStatus): Promise<void> {
  const serverStatus = await getStatus();
  return new Promise<void>((resolve, reject) => {
    request.post(
      `${API_DOMAIN}/update-download-status`,
      {body: JSON.stringify({accountId: ACCOUNT_ID, nzbId, downloadStatus, serverStatus})},
      (err: unknown) => {
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
}

const inProgressDownload: Record<string, {imdbId: string; queueNumber: number}> = {};

async function startAndMonitorDownload(imdbId: string, nzbId: string): Promise<DownloadStatus> {
  const queueNumber = await startNzbDownload(nzbId);
  inProgressDownload[nzbId] = {imdbId, queueNumber};
  return new Promise<DownloadStatus>((resolve, reject) => {
    function recursiveCheck(): void {
      getDownloadStatus(queueNumber)
        .then(async status => {
          await updateState(nzbId, status);
          if (status.inQueue) {
            setTimeout(recursiveCheck, 2 * 1000);
          } else {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete inProgressDownload[nzbId];
            resolve(status);
          }
        })
        .catch(reject);
    }
    recursiveCheck();
  });
}

async function iter(): Promise<void> {
  const {dstDir} = await getConfig();

  const db = await initDb(dstDir);
  const dbHashes = new Set(db.movies.map(movie => `${movie.imdbId}_${movie.nzbId}`));

  const targetState = await getTargetState();
  const targetHashes = new Set(targetState.map(movie => `${movie.imdbId}_${movie.nzbId}`));

  const toDelete = db.movies.filter(movie => !targetHashes.has(`${movie.imdbId}_${movie.nzbId}`));
  const toDownload = targetState.filter(
    movie => !dbHashes.has(`${movie.imdbId}_${movie.nzbId}`) && !inProgressDownload[movie.nzbId]
  );

  console.log({toDelete, toDownload});

  // Deletion
  for (const movie of toDelete) {
    await deleteHistory(movie.nzbId);
    await rm(movie.path, {force: true, recursive: true});
    db.movies = db.movies.filter(m => !(movie.imdbId === m.imdbId && movie.nzbId === m.nzbId));
    await db.save();
    await updateState(movie.nzbId, undefined);
  }

  // Download
  for (const movie of toDownload) {
    const finalStatus = await startAndMonitorDownload(movie.imdbId, movie.nzbId);
    const realStatus =
      finalStatus.path.length === 0
        ? (await getDownloadStatusFromHistory(movie.nzbId)) ?? finalStatus
        : finalStatus;
    await updateState(movie.nzbId, realStatus);
    const m = {imdbId: movie.imdbId, nzbId: movie.nzbId, path: realStatus.path};
    db.movies.push(m);
    await db.save();
  }
}

let lastIter = 0;
const LOOP_PERIOD = 60 * 1000;

function run(): void {
  lastIter = Date.now();
  iter()
    .catch(console.error)
    .finally(() => {
      const waitTime = Math.max(0, LOOP_PERIOD - (Date.now() - lastIter));
      setTimeout(run, waitTime);
    });
}

run();
