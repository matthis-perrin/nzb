import request from 'request';

import {TmdbMovie, TmdbTvShow} from '@shared/models';
import {
  asMapArrayOrThrow,
  asMapOrThrow,
  asNumber,
  asStringOrThrow,
  neverHappens,
} from '@shared/type_utils';

const OK = 200;

const TMDB_API_KEY = '9330f6feba3777cad389a8b85b8a925d';

type TmdbInfo = {tmdbMovie: TmdbMovie} | {tmdbTvShow: TmdbTvShow};

export async function getTmdbInfoFromApi(imdbId: string): Promise<TmdbInfo> {
  const {id, type} = await getTmdbIdFromApi(imdbId);

  if (type === 'movie') {
    return new Promise<TmdbInfo>((resolve, reject) => {
      const url = `https://api.themoviedb.org/3/movie/${id}?language=en-US&api_key=${TMDB_API_KEY}`;
      request.get({url}, (err: unknown, resp, body: unknown) => {
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        if (err) {
          reject(err);
        } else {
          if (resp.statusCode !== OK) {
            console.log(resp.statusCode, url, body);
            throw new Error(`TMDB API failure (getTmdbInfo movie): ${body}`);
          }
          // Parse results
          const res = JSON.parse(asStringOrThrow(body));
          resolve({tmdbMovie: res as TmdbMovie});
        }
      });
    });
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  } else if (type === 'tv-show') {
    return new Promise<TmdbInfo>((resolve, reject) => {
      const url = `https://api.themoviedb.org/3/tv/${id}?language=en-US&api_key=${TMDB_API_KEY}`;
      request.get({url}, (err: unknown, resp, body: unknown) => {
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        if (err) {
          reject(err);
        } else {
          if (resp.statusCode !== OK) {
            console.log(resp.statusCode, url, body);
            throw new Error(`TMDB API failure (getTmdbInfo tv): ${body}`);
          }
          // Parse results
          const res = JSON.parse(asStringOrThrow(body));
          resolve({tmdbTvShow: res as TmdbTvShow});
        }
      });
    });
  }
  neverHappens(type);
}

async function getTmdbIdFromApi(imdbId: string): Promise<{id: number; type: 'movie' | 'tv-show'}> {
  return new Promise<{id: number; type: 'movie' | 'tv-show'}>((resolve, reject) => {
    const url = `https://api.themoviedb.org/3/find/${imdbId}?external_source=imdb_id&api_key=${TMDB_API_KEY}`;
    request.get({url}, (err: unknown, resp, body: unknown) => {
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      if (err) {
        reject(err);
      } else {
        if (resp.statusCode !== OK) {
          console.log(resp.statusCode, url, body);
          throw new Error(`TMDB API failure (getTmdbId): ${body}`);
        }

        // Parse results
        const res = JSON.parse(asStringOrThrow(body));
        const resMap = asMapOrThrow(res);
        const movieResults = asMapArrayOrThrow(resMap['movie_results']);
        const tvResults = asMapArrayOrThrow(resMap['tv_results']);
        const movieMatch = asNumber(movieResults[0]?.['id']);
        const tvMatch = asNumber(tvResults[0]?.['id']);

        if (movieMatch !== undefined) {
          resolve({id: movieMatch, type: 'movie'});
        } else if (tvMatch !== undefined) {
          resolve({id: tvMatch, type: 'tv-show'});
        } else {
          console.error(`Failure to retrieve movie/tv with imdbId ${imdbId}`, resMap);
          reject(new Error('No match'));
        }
      }
    });
  });
}
