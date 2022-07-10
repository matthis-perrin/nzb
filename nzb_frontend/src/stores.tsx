import {API_DOMAIN} from '../../shared/src/constant';
import {ImdbNzbInfoLight, NzbDaemonStatus, NzbGetStatus} from '../../shared/src/models';
import {asMapArrayOrThrow, asMapOrThrow} from '../../shared/src/type_utils';
import {createDataStore} from './data_store';
import {notifyError} from './errors';

interface DaemonState {
  nzb: NzbDaemonStatus[];
  status: NzbGetStatus;
}

const daemonData = createDataStore<{state?: DaemonState | undefined; isLoading: boolean}>({
  isLoading: false,
});

export const useDaemonData = daemonData.useData;
export const getDaemonData = daemonData.getData;
export const setDaemonData = daemonData.setData;

export function refreshDaemonData(): void {
  refreshDaemonDataWithPromise().catch(() => {});
}

export async function refreshDaemonDataWithPromise(): Promise<void> {
  setDaemonData({...getDaemonData(), isLoading: true});
  return fetch(`${API_DOMAIN}/get-state`, {
    method: 'POST',
    body: JSON.stringify({accountId: 'matthis'}),
  })
    .then(async res => res.json())
    .then(res => {
      const data = asMapOrThrow(res);
      const nzb = asMapArrayOrThrow(data.items).map(item => item as NzbDaemonStatus);
      const status = asMapOrThrow(data.serverStatus) as NzbGetStatus;
      setDaemonData({state: {nzb, status}, isLoading: false});
    })
    .catch(err => {
      notifyError('Failure to fetch daemon state')(err);
      setDaemonData({...getDaemonData(), isLoading: false});
    });
}

//

interface ImdbState {
  movies: ImdbNzbInfoLight[];
}

const imdbData = createDataStore<{state?: ImdbState | undefined; isLoading: boolean}>({
  isLoading: false,
});

export const useImdbData = imdbData.useData;
export const getImdbData = imdbData.getData;
export const setImdbData = imdbData.setData;

export function refreshImdbData(): void {
  setImdbData({...getImdbData(), isLoading: true});
  fetch(`${API_DOMAIN}/get-recent-imdb`, {method: 'POST', body: JSON.stringify({limit: 30})})
    .then(async res => res.json())
    .then(res => {
      const movies = asMapArrayOrThrow(asMapOrThrow(res).items).map(
        item => item as ImdbNzbInfoLight
      );
      setImdbData({state: {movies}, isLoading: false});
      setImdbRegistry(
        new Map<string, ImdbNzbInfoLight>([
          ...getImdbRegistry().entries(),
          ...movies.map(m => [m.imdbId, m] as const),
        ])
      );
    })
    .catch(err => {
      notifyError('Failure to fetch IMDB movies')(err);
      setImdbData({...getImdbData(), isLoading: false});
    });
}

//

const imdbRegistry = createDataStore(new Map<string, ImdbNzbInfoLight>());

export const useImdbRegistry = imdbRegistry.useData;
export const getImdbRegistry = imdbRegistry.getData;
export const setImdbRegistry = imdbRegistry.setData;

const fetchingImdb = new Set<string>();

export function fetchImdb(imdbId: string): void {
  if (fetchingImdb.has(imdbId)) {
    return;
  }
  fetchingImdb.add(imdbId);
  fetch(`${API_DOMAIN}/get-imdb`, {method: 'POST', body: JSON.stringify({imdbId})})
    .then(async res => res.json())
    .then(res => {
      const movie = asMapOrThrow(res) as ImdbNzbInfoLight;
      setImdbRegistry(
        new Map<string, ImdbNzbInfoLight>([...getImdbRegistry().entries(), [movie.imdbId, movie]])
      );
    })
    .catch(err => {
      notifyError(`Failure to fetch IMDB movie with id ${imdbId}`)(err);
    });
}
