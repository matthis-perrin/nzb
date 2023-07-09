import {ALL} from '@shared/api/api';
import {NotFoundError} from '@shared/api/core/api_errors';
import {parseSchema} from '@shared/api/core/api_parser';
import {AllApiSchema} from '@shared/api/core/api_schema';
import {ApiName, FlatApi} from '@shared/api/core/api_types';

export function createRouter<Name extends ApiName>(
  apiName: Name,
  handlers: {
    [Endpoint in keyof FlatApi<Name>]: (
      req: FlatApi<Name>[Endpoint]['req']
    ) => FlatApi<Name>[Endpoint]['res'] | Promise<FlatApi<Name>[Endpoint]['res']>;
  }
): (path: string, method: string, body: Record<string, unknown>) => Promise<unknown> {
  const apiSchemas = (ALL as AllApiSchema)[apiName as string];
  const apiHandlers = handlers as Record<string, (req: unknown) => unknown>;
  return async (path: string, method: string, body: Record<string, unknown>): Promise<unknown> => {
    const schema = apiSchemas?.[path]?.[method];
    const handler = apiHandlers[`${method} ${path}`];
    if (!schema || !handler) {
      throw new NotFoundError({
        internalMessage: `No schema/handler while routing request`,
        extra: {
          apiName,
          path,
          method,
        },
      });
    }
    const req = parseSchema(body, schema.req);
    // eslint-disable-next-line unicorn/no-useless-promise-resolve-reject
    return Promise.resolve(handler(req));
  };
}
