import request from 'request';

import {ImdbInfo} from '../../shared/models';
import {asMap, asMapArray, asMapOrThrow, asNumber, asString, asStringOrThrow} from './type_utils';

const OK = 200;

const API_KEY = 'k_udmpb1il';

export async function imdbInfo(imdbId: string): Promise<unknown> {
  return new Promise<unknown>((resolve, reject) => {
    const url = `https://imdb-api.com/en/API/Title/${API_KEY}/${imdbId}`;
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
