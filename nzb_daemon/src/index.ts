import {rm} from 'fs/promises';
import request from 'request';

import {API_DOMAIN} from '../../shared/src/constant';
import {DownloadStatus, NzbDaemonStatus} from '../../shared/src/models';
import {asStringOrThrow} from '../../shared/src/type_utils';
import {initDb} from './db';
import {getConfig, getDownloadStatus, startNzbDownload} from './nzbget';

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
          resolve(JSON.parse(asStringOrThrow(body)).items as NzbDaemonStatus[]);
        }
      }
    );
  });
}

async function updateState(nzbId: string, downloadStatus: DownloadStatus): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    request.post(
      `${API_DOMAIN}/update-download-status`,
      {body: JSON.stringify({accountId: ACCOUNT_ID, nzbId, downloadStatus})},
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
    await rm(movie.path);
    db.movies = db.movies.filter(m => !(movie.imdbId === m.imdbId && movie.nzbId === m.nzbId));
    await db.save();
  }

  // Download
  for (const movie of toDownload) {
    const finalStatus = await startAndMonitorDownload(movie.imdbId, movie.nzbId);
    db.movies.push({imdbId: movie.imdbId, nzbId: movie.nzbId, path: finalStatus.path});
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
