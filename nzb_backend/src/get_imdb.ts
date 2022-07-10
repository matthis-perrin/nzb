import {getImdbInfoItemLight} from '../../shared/src/dynamo';
import {asStringOrThrow} from '../../shared/src/type_utils';

export async function getImdb(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const imdbId = asStringOrThrow(body.imdbId);
  const item = await getImdbInfoItemLight(imdbId);
  if (!item) {
    throw new Error(`Movie with imdbId "${imdbId}" not found`);
  }
  return item;
}
