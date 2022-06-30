import {queryLastReleasedImdbInfoItems} from '../../shared/src/dynamo';
import {asNumber} from '../../shared/src/type_utils';

export async function getImdb(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const limit = asNumber(body.limit, 100);
  const res = await queryLastReleasedImdbInfoItems(limit);
  return {items: res};
}
