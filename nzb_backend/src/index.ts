import {getImdb} from './get_imdb';
import {getState} from './get_state';
import {startDownload} from './start_download';
import {updateDownloadStatus} from './update_download_status';

export interface ApiGatewayProxyEventBase {
  body: string | null;
  headers: Record<string, string | undefined>;
  multiValueHeaders: Record<string, string[] | undefined>;
  httpMethod: string;
  isBase64Encoded: boolean;
  path: string;
  pathParameters: Record<string, string | undefined> | null;
  queryStringParameters: Record<string, string | undefined> | null;
  multiValueQueryStringParameters: Record<string, string[] | undefined> | null;
  stageVariables: Record<string, string | undefined> | null;
  resource: string;
}

/**
 * Works with Lambda Proxy Integration for Rest API or HTTP API integration Payload Format version 1.0
 * @see - https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-develop-integrations-lambda.html
 */
export interface ApiGatewayProxyResult {
  statusCode: number;
  headers?: Record<string, boolean | number | string> | undefined;
  multiValueHeaders?: Record<string, (boolean | number | string)[]> | undefined;
  body: string;
  isBase64Encoded?: boolean | undefined;
}

interface LambdaEvent {
  path: string;
  headers: Record<string, string>;
  httpMethod: string;
  body: string | null;
}

interface LambdaResponse {
  headers?: Record<string, string>;
  statusCode: number;
  body: string;
}

function normalizePath(path: string): string {
  const withLeading = path.startsWith('/') ? path : `/${path}`;
  const withoutTrailing = withLeading.endsWith('/') ? withLeading.slice(0, -1) : withLeading;
  return withoutTrailing;
}

function parseBody(body: string | null): Record<string, unknown> {
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

export async function handler(event: LambdaEvent): Promise<LambdaResponse> {
  const method = event.httpMethod.toUpperCase();
  const path = normalizePath(event.path);

  // console.log('<<<<<<<<<', method, path);

  // CORS
  /* eslint-disable @typescript-eslint/naming-convention */
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
  };
  /* eslint-enable @typescript-eslint/naming-convention */

  if (method === 'GET' && (path === '' || path === '/' || path === '/index.html')) {
    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html',
      },
      // eslint-disable-next-line node/no-process-env
      body: process.env.INDEX_HTML ?? '',
    };
  }

  const body = parseBody(event.body);
  // console.log('BODY', body);

  if (method === 'POST' && path === '/get-state') {
    return {
      statusCode: 200,
      body: JSON.stringify(await getState(body)),
      headers: corsHeaders,
    };
  }

  if (method === 'POST' && path === '/get-imdb') {
    return {
      statusCode: 200,
      body: JSON.stringify(await getImdb(body)),
      headers: corsHeaders,
    };
  }

  if (method === 'POST' && path === '/start-download') {
    return {
      statusCode: 200,
      body: JSON.stringify(await startDownload(body)),
      headers: corsHeaders,
    };
  }

  if (method === 'POST' && path === '/update-download-status') {
    return {
      statusCode: 200,
      body: JSON.stringify(await updateDownloadStatus(body)),
      headers: corsHeaders,
    };
  }

  return {
    statusCode: 404,
    body: '',
    headers: corsHeaders,
  };
}
