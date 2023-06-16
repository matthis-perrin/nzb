import {NODE_ENV, NZB_FRONTEND_CLOUDFRONT_DOMAIN_NAME} from '@shared/env';

interface LambdaEvent {
  headers: Record<string, string | string[]>;
  queryStringParameters?: Record<string, string>;
  requestContext: {
    http: {
      method: string;
      path: string;
    };
    timeEpoch: number;
  };
  body?: string;
}

interface LambdaResponse {
  headers?: Record<string, string | undefined>;
  statusCode: number;
  body: string;
}

function normalizePath(path: string): string {
  const withLeading = path.startsWith('/') ? path : `/${path}`;
  const withoutTrailing = withLeading.endsWith('/') ? withLeading.slice(0, -1) : withLeading;
  return withoutTrailing;
}

function parseBody(body?: string | null): Record<string, unknown> {
  let jsonBody = {};
  if (typeof body === 'string') {
    try {
      jsonBody = JSON.parse(body);
    } catch {
      // leave jsonBody as an empty object
    }
  }
  return jsonBody;
}

const allowedOrigin = new Set([
  `http${NODE_ENV === 'development' ? '' : 's'}://${NZB_FRONTEND_CLOUDFRONT_DOMAIN_NAME}`,
]);

export async function handler(event: LambdaEvent): Promise<LambdaResponse> {
  const {headers, requestContext} = event;
  const origin =
    (Array.isArray(headers['origin']) ? headers['origin'][0] : headers['origin']) ?? '';
  const {http} = requestContext;
  const method = http.method.toUpperCase();
  const path = normalizePath(http.path);
  const body = parseBody(event.body);

  await Promise.resolve();

  if (method === 'GET' && (path === '' || path === '/' || path === '/index.html')) {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/html',
        'Access-Control-Allow-Origin': allowedOrigin.has(origin) ? origin : undefined,
      },
      body: `<html><body><h1>INDEX HTML</h1><pre>${JSON.stringify(
        event,
        undefined,
        2
      )}</pre></body></html>`,
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      method,
      path,
      body,
    }),
  };
}
