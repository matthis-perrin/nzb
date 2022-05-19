export interface NzbsuRegistryItem {
  guid: string;
  title: string;
  size: number;
  pubTs: number;
  imdbId: string;
  imdbTitle?: string;
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
