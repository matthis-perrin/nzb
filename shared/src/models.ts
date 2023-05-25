export enum HealthStatus {
  Unknown = 'unknown',
  Healthy = 'healthy',
  Unhealthy = 'unhealthy',
}

export interface NzbsuItem {
  guid: string;
  title: string;
  size: number;
  pubTs: number;
  imdbId: string;
  imdbTitle?: string;
  healthStatus: HealthStatus;
  healthTs: number;
  healthFailed: number;
  healthSuccess: number;
}

//
// TMDB
//

export interface TmdbCollection {
  id: number;
  name: string;
  poster_path: string;
  backdrop_path: string;
}

export interface TmdbProductionCompany {
  id: number;
  logo_path: string | null;
  name: string;
  origin_country: string;
}

export interface TmdbMovie {
  adult: boolean;
  backdrop_path: string;
  belongs_to_collection: TmdbCollection | null;
  budget: number;
  genres: {id: number; name: string}[];
  homepage: string;
  id: number;
  imdb_id: string;
  original_language: string;
  original_title: string;
  overview: string;
  popularity: number;
  poster_path: string;
  production_companies: TmdbProductionCompany[];
  production_countries: {
    iso_3166_1: string;
    name: string;
  }[];
  release_date: string; // '1995-09-15'
  revenue: number;
  runtime: number;
  spoken_languages: {
    english_name: string;
    iso_639_1: string;
    name: string;
  }[];
  status: string;
  tagline: string;
  title: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
}

export interface TmdbMovieItem extends TmdbMovie {
  bestNzbId: string;
  bestNzbSize: number;
  bestNzbDate: number;
  bestNzbTitle: string;
}

export interface TmdbTvShow {
  adult: boolean;
  backdrop_path: string;
  created_by: {
    id: number;
    credit_id: string;
    name: string;
    gender: number;
    profile_path: string | null;
  }[];
  episode_run_time: number[];
  first_air_date: string;
  genres: {
    id: number;
    name: string;
  }[];
  homepage: string;
  id: number;
  in_production: false;
  languages: string[];
  last_air_date: string;
  last_episode_to_air: {
    id: number;
    name: string;
    overview: string;
    vote_average: number;
    vote_count: number;
    air_date: string;
    episode_number: number;
    production_code: string;
    runtime: number;
    season_number: number;
    show_id: number;
    still_path: string;
  };
  name: string;
  next_episode_to_air: null;
  networks: {
    id: number;
    logo_path: string;
    name: string;
    origin_country: string;
  }[];
  number_of_episodes: number;
  number_of_seasons: number;
  origin_country: string[];
  original_language: string;
  original_name: string;
  overview: string;
  popularity: number;
  poster_path: string;
  production_companies: {
    id: number;
    logo_path: null;
    name: string;
    origin_country: string;
  }[];
  production_countries: {
    iso_3166_1: string;
    name: string;
  }[];
  seasons: {
    air_date: string;
    episode_count: number;
    id: number;
    name: string;
    overview: string;
    poster_path: string;
    season_number: number;
  }[];
  spoken_languages: {
    english_name: string;
    iso_639_1: string;
    name: string;
  }[];
  status: string;
  tagline: string;
  type: string;
  vote_average: number;
  vote_count: number;
}

export interface TmdbTvShowItem extends TmdbTvShow {
  imdb_id: string;
}

export interface ImdbEntity {
  id: string;
  name: string;
}

export interface ImdbActor extends ImdbEntity {
  image: string;
  asCharacter: string;
}

export interface ImdbInfo {
  imdbId: string;
  title: string;
  image?: string;
  posters: string[];
  backdrops: string[];
  images: string[];
  releaseDate?: number;
  runtimeMins?: number;
  plot?: string;
  awards?: string;
  directors: ImdbEntity[];
  writers: ImdbEntity[];
  stars: ImdbEntity[];
  actors: ImdbActor[];
  genres: string[];
  companies: ImdbEntity[];
  countries: string[];
  languages: string[];
  imdbRatingVotes?: number;
  imdbRating?: number;
  metacriticRating?: number;
  theMovieDbRating?: number;
  rottenTomatoesRating?: number;
}

export interface ImdbNzbInfo extends ImdbInfo {
  bestNzbId: string;
  bestNzbSize: number;
  bestNzbDate: number;
  bestNzbTitle: string;
}

export type ImdbNzbInfoLight = Omit<
  ImdbNzbInfo,
  'directors' | 'writers' | 'stars' | 'actors' | 'companies'
>;

export interface DownloadStatus {
  fileSizeMb: number;
  downloadedSizeMb: number;
  status: string;
  path: string;
  inQueue: boolean;
}

export type NzbDaemonTargetState = 'force-download' | 'download' | 'delete';

export interface NzbDaemonStatus {
  accountId: string;
  imdbId: string;
  nzbId: string;
  nzbTitle: string;
  nzbPubTs: number;
  nzbSize: number;
  targetState: NzbDaemonTargetState;
  downloadStatus?: DownloadStatus;
}

export interface Account {
  accountId: string;
  minReleaseDate: string;
}

export interface NzbGetStatus {
  downloadRate: number;
}
