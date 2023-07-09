import {HttpError} from '@shared/api/core/api_errors';
import {createRouter} from '@shared/api/core/api_router';
import {NODE_ENV, NZB_FRONTEND_CLOUDFRONT_DOMAIN_NAME} from '@shared/env';

import {meHandler, meHandler2} from '@src/handlers/me_handler';

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

// Create API router
const router = createRouter('backend', {
  'POST /me': meHandler,
  'GET /me2': meHandler2,
});

export async function handler(event: LambdaEvent): Promise<LambdaResponse> {
  // Extract event info
  const {headers, requestContext} = event;
  const origin =
    (Array.isArray(headers['origin']) ? headers['origin'][0] : headers['origin']) ?? '';
  const {http} = requestContext;
  const method = http.method.toUpperCase();
  const path = normalizePath(http.path);

  // Utility to build a response
  const res = (
    body: string,
    opts?: {statusCode?: number; contentType?: string}
  ): LambdaResponse => {
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    const {statusCode = 200, contentType = 'application/json'} = opts ?? {};
    const corsHeaders = allowedOrigin.has(origin)
      ? {
          'Access-Control-Allow-Origin': allowedOrigin.has(origin) ? origin : undefined,
          'Access-Control-Allow-Headers': 'content-type',
        }
      : {};
    return {
      statusCode,
      headers: {
        contentType,
        ...corsHeaders,
      },
      body,
    };
  };

  // Handle CORS
  if (method === 'OPTIONS') {
    return res('');
  }

  // Serve static resources
  if (method === 'GET' && (path === '' || path === '/' || path === '/index.html')) {
    return res(
      `<html><body><h1>INDEX HTML</h1><pre>${JSON.stringify(
        event,
        undefined,
        2
      )}</pre></body></html>`,
      {contentType: 'text/html'}
    );
  }

  // Handle API calls
  console.log(event);
  const body = parseBody(event.body);
  try {
    const routerRes = await router(path, method, body);
    return res(JSON.stringify(routerRes));
  } catch (err: unknown) {
    if (err instanceof HttpError) {
      const {statusCode, userMessage, stack, extra} = err;
      console.log(statusCode, extra, stack);
      return res(JSON.stringify({err: userMessage}), {statusCode});
    }
    console.error(err);
    return res(JSON.stringify({err: 'internal error'}), {statusCode: 500});
  }
}
