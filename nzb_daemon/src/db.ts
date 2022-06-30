import {access, readFile, writeFile} from 'fs/promises';
import {join} from 'path';

import {asMapArrayOrThrow, removeUndefined} from '../../shared/src/type_utils';
import {MovieFileMetadata} from './models';

const DB_FILE = 'db.json';

class Db {
  public movies: MovieFileMetadata[] = [];

  public constructor(private readonly dstDir: string) {}

  public async load(): Promise<void> {
    let dbFile: string;
    try {
      const dbFileBuffer = await readFile(this.getDbPath());
      dbFile = dbFileBuffer.toString();
    } catch {
      dbFile = '[]';
      await writeFile(this.getDbPath(), dbFile);
    }
    this.movies = asMapArrayOrThrow(JSON.parse(dbFile.toString())) as MovieFileMetadata[];
  }

  public async save(): Promise<void> {
    await writeFile(this.getDbPath(), `${JSON.stringify(this.movies, undefined, 2)}\n`);
  }

  private getDbPath(): string {
    return join(this.dstDir, DB_FILE);
  }
}

export async function initDb(dstDir: string): Promise<Db> {
  const db = new Db(dstDir);
  await db.load();
  const validMovies = await Promise.all(
    db.movies.map(async movie => {
      try {
        await access(movie.path);
        return movie;
      } catch {
        return undefined;
      }
    })
  );
  db.movies = removeUndefined(validMovies);
  await db.save();
  return db;
}
