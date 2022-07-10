export enum HealthStatus {
  Unknown = 'unknown',
  Healthy = 'healthy',
  Unhealthy = 'unhealthy',
}

export interface NzbsuRegistryItem {
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
