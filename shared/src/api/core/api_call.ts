import {ALL, API_CONFIGS} from '@shared/api/api';
import {parseSchema} from '@shared/api/core/api_parser';
import {AllApiSchema} from '@shared/api/core/api_schema';
import {ApiName, FlatApi} from '@shared/api/core/api_types';
import {asJson, asString} from '@shared/type_utils';

interface RequestInit {
  method?: string;
  body?: string;
  headers?: Record<string, string>;
}
interface Response {
  text: () => Promise<string>;
  status: number;
}
type Fetcher = (input: string, init?: RequestInit) => Promise<Response>;

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/explicit-function-return-type
export function apiCaller<Name extends ApiName>(api: Name, fetcher: Fetcher) {
  const {host} = API_CONFIGS[api];
  const sanitizedHost = host.endsWith('/') ? host.slice(0, -1) : host;
  const apiSchemas = (ALL as AllApiSchema)[api as string];

  async function apiCall<Endpoint extends keyof FlatApi<Name>>(
    endpoint: Endpoint,
    req: FlatApi<Name>[Endpoint]['req']
  ): Promise<FlatApi<Name>[Endpoint]['res']> {
    const [method = 'GET', path = ''] = endpoint.split(' ', 2);

    const schema = apiSchemas?.[path]?.[method];
    if (!schema) {
      throw new Error(`No schema for endpoint ${String(endpoint)}`);
    }

    const sanitizedPath = path.startsWith('/') ? path : `/${path}`;
    const url = `${sanitizedHost}${sanitizedPath}`;
    const body = JSON.stringify(req);
    const res = await fetcher(url, {
      method,
      body,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
    const resText = await res.text();
    const debugInfo = {api, method, path, res: resText};
    // ERROR
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    if (res.status >= 400) {
      const resErr = asString(asJson(resText, {})['err']);
      if (resErr === undefined) {
        console.error(`Invalid API response, no err field in response`, debugInfo);
        throw new Error('Unexpected error');
      }
      throw new Error(resErr);
    }
    // SUCCESS
    else {
      const resJson = asJson(resText);
      if (resJson === undefined) {
        console.error(`Invalid API response, not a json`, debugInfo);
        throw new Error('Unexpected error');
      }
      try {
        const res = parseSchema(resJson, schema.res);
        return res as FlatApi<Name>[Endpoint]['res'];
      } catch (err: unknown) {
        console.error(`Invalid API response, schema not respected`, debugInfo, err);
        throw new Error('Unexpected error');
      }
    }
  }
  return apiCall;
}
