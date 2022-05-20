import request from 'request';

import {IMDB_API_KEY} from './constant';
import {ImdbInfo} from './models';
import {
  asMap,
  asMapArray,
  asMapArrayOrThrow,
  asMapOrThrow,
  asNumber,
  asNumberOrThrow,
  asString,
  asStringOrThrow,
} from './type_utils';

const OK = 200;

export async function imdbSearch(fileName: string): Promise<ImdbSearch | undefined> {
  let simplerFileName = fileName.match(/^.*?(?:2160|19\d{2}|20[0-2]\d)/gu)?.[0];
  if (simplerFileName === undefined) {
    return imdbSearchApiCall(fileName);
  }
  if (simplerFileName.endsWith('2160')) {
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    simplerFileName = simplerFileName.slice(0, -4);
  }
  return imdbSearchApiCall(simplerFileName);
}

interface ImdbSearch {
  id: string;
  title: string;
}

async function imdbSearchApiCall(fileName: string): Promise<ImdbSearch | undefined> {
  return new Promise<ImdbSearch | undefined>((resolve, reject) => {
    const url = `https://imdb-api.com/en/API/SearchMovie/${IMDB_API_KEY}/${fileName.replace(
      /[\s+]+/gu,
      '.'
    )}`;
    request.get({url}, (err: unknown, resp, body: unknown) => {
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      if (err) {
        reject(err);
      } else {
        if (resp.statusCode !== OK) {
          console.log(url, body);
          throw new Error(`API_FAILURE (${resp.statusCode})`);
        }
        resolve(parseImdbSearch(JSON.parse(asStringOrThrow(body))));
      }
    });
  });
}

function parseImdbSearch(res: unknown): ImdbSearch | undefined {
  const json = asMapOrThrow(res);
  if (typeof json.errorMessage === 'string' && json.errorMessage.length > 0) {
    throw new Error(`API error "${json.errorMessage}"`);
  }
  try {
    const firstResult = asMapOrThrow(asMapArrayOrThrow(json.results)[0]);
    return {
      id: asStringOrThrow(firstResult.id),
      title: asStringOrThrow(firstResult.title),
    };
  } catch {
    return undefined;
  }
}

export async function imdbInfo(imdbId: string): Promise<unknown> {
  return new Promise<unknown>((resolve, reject) => {
    const url = `https://imdb-api.com/en/API/Title/${IMDB_API_KEY}/${imdbId}`;
    request.get({url}, (err: unknown, resp, body: unknown) => {
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      if (err) {
        reject(err);
      } else {
        if (resp.statusCode !== OK) {
          console.log(url, body);
          throw new Error('API_FAILURE');
        }
        resolve(JSON.parse(asStringOrThrow(body)));
      }
    });
  });
}

function parseRuntime(data: unknown): number | undefined {
  if (typeof data === 'number') {
    return data;
  } else if (typeof data === 'string') {
    if (data.startsWith('PT')) {
      const value = parseFloat(data.slice(2, -1));
      if (!Number.isFinite(value)) {
        throw new Error(`Invalid runtime value ${JSON.stringify(data)}`);
      }
      const unit = data.slice(-1);
      if (unit === 'M') {
        return value;
      } else if (unit === 'H') {
        return value * 60;
      }
      throw new Error(`Invalid runtime value ${JSON.stringify(data)}`);
    } else {
      return asNumber(data);
    }
  } else {
    return undefined;
  }
}

export function parseImdbInfo(res: unknown): ImdbInfo {
  const json = asMapOrThrow(res);

  const imdbId = asStringOrThrow(json.id);
  const title = asStringOrThrow(json.title);
  const image = asString(json.image);
  const releaseDateString = asString(json.releaseDate);
  const releaseDate =
    releaseDateString === undefined ? undefined : new Date(releaseDateString).getTime();
  const runtimeMins = parseRuntime(json.runtimeMins);
  const plot = asString(json.plot);
  const awards = asString(json.awards);
  const directors = asMapArray(json.directorList, []).map(a => ({
    id: asStringOrThrow(a.id),
    name: asStringOrThrow(a.name),
  }));
  const writers = asMapArray(json.writerList, []).map(a => ({
    id: asStringOrThrow(a.id),
    name: asStringOrThrow(a.name),
  }));
  const stars = asMapArray(json.starList, []).map(a => ({
    id: asStringOrThrow(a.id),
    name: asStringOrThrow(a.name),
  }));
  const actors = asMapArray(json.actorList, []).map(a => ({
    id: asStringOrThrow(a.id),
    image: asStringOrThrow(a.image),
    name: asStringOrThrow(a.name),
    asCharacter: asStringOrThrow(a.asCharacter),
  }));
  const genres = asMapArray(json.genreList, []).map(a => asStringOrThrow(a.value));
  const companies = asMapArray(json.companyList, []).map(a => ({
    id: asStringOrThrow(a.id),
    name: asStringOrThrow(a.name),
  }));
  const countries = asMapArray(json.countryList, []).map(a => asStringOrThrow(a.value));
  const languages = asMapArray(json.languageList, []).map(a => asStringOrThrow(a.value));
  const imdbRatingVotes = asNumber(json.imDbRatingVotes);
  const imdbRating = asNumber(json.imDbRating);
  const metacriticRating = asNumber(json.metacriticRating);
  const ratings = asMap(json.ratings, {});
  const theMovieDbRating = asNumber(ratings.theMovieDb);
  const rottenTomatoesRating = asNumber(ratings.rottenTomatoes);
  const posterData = asMap(json.posters, {});
  const posters = asMapArray(posterData.posters, []).map(a => asStringOrThrow(a.link));
  const backdrops = asMapArray(posterData.backdrops, []).map(a => asStringOrThrow(a.link));
  const imageData = asMap(json.images, {});
  const images = asMapArray(imageData.images, []).map(a => asStringOrThrow(a.image));

  return {
    imdbId,
    title,
    image,
    releaseDate,
    runtimeMins,
    plot,
    awards,
    directors,
    writers,
    stars,
    actors,
    genres,
    companies,
    countries,
    languages,
    imdbRatingVotes,
    imdbRating,
    metacriticRating,
    theMovieDbRating,
    rottenTomatoesRating,
    posters,
    backdrops,
    images,
  };
}

export async function apiCallLeft(): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    const url = `https://imdb-api.com/en/API/Usage/${IMDB_API_KEY}`;
    request.get({url}, (err: unknown, resp, body: unknown) => {
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      if (err) {
        reject(err);
      } else {
        if (resp.statusCode !== OK) {
          console.log(url, body);
          throw new Error(`API_FAILURE (${resp.statusCode})`);
        }
        const res = JSON.parse(asStringOrThrow(body));
        const count = asNumberOrThrow(res.count);
        const maximum = asNumberOrThrow(res.maximum);
        resolve(maximum - count);
      }
    });
  });
}
