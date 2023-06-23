import {NotFoundError} from '@shared/api/api_errors';
import {parseSchema} from '@shared/api/api_parser';
import {ALL} from '@shared/api/api_routes';
import {AllApiSchema} from '@shared/api/api_schema';
import {ApiMethod, ApiName, ApiPath, Request, Response} from '@shared/api/api_types';

export type ApiHandler<
  Name extends ApiName,
  Path extends ApiPath<Name>,
  Method extends ApiMethod<Name, Path>
> = (
  req: Request<Name, Path, Method>
) => Response<Name, Path, Method> | Promise<Response<Name, Path, Method>>;

export function createRouter<Name extends ApiName>(
  apiName: Name,
  handlers: {
    [Path in keyof (typeof ALL)[Name]]: {
      [Method in keyof (typeof ALL)[Name][Path]]: ApiHandler<Name, Path, Method>;
    };
  }
): (path: string, method: string, body: Record<string, unknown>) => Promise<unknown> {
  const apiSchemas = (ALL as AllApiSchema)[apiName];
  const apiHandlers = handlers as Record<string, Record<string, (req: unknown) => unknown>>;
  return async (path: string, method: string, body: Record<string, unknown>): Promise<unknown> => {
    const schema = apiSchemas?.[path]?.[method];
    const handler = apiHandlers[path]?.[method];
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
