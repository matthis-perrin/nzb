import {rm} from 'fs/promises';

import {initDb} from './db';
import {DownloadStatus, getConfig, getDownloadStatus, startNzbDownload} from './nzbget';

async function getTargetState(): Promise<{imdbId: string; nzbId: string}[]> {
  // eslint-disable-next-line unicorn/no-useless-promise-resolve-reject
  return Promise.resolve([{imdbId: 'tt1877830', nzbId: 'a2b0f7798b21ecad023825fa4ff6cfd6'}]);
}

async function updateState(imdbId: string, nzbId: string, status: DownloadStatus): Promise<void> {
  console.log(`UPDATE STATUS`, {imdbId, nzbId, status});
  // eslint-disable-next-line unicorn/no-useless-promise-resolve-reject
  return Promise.resolve();
}

const inProgressDownload: Record<string, {imdbId: string; queueNumber: number}> = {};

async function startAndMonitorDownload(imdbId: string, nzbId: string): Promise<DownloadStatus> {
  const queueNumber = await startNzbDownload(nzbId);
  inProgressDownload[nzbId] = {imdbId, queueNumber};
  return new Promise<DownloadStatus>((resolve, reject) => {
    function recursiveCheck(): void {
      getDownloadStatus(queueNumber)
        .then(async status => {
          await updateState(imdbId, nzbId, status);
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

async function test(): Promise<void> {
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

test().catch(console.error);
