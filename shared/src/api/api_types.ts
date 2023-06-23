import {Schema, SchemaToInterface} from '@shared/api/api_schema';

import {ALL} from '@src/api/api_routes';

export type ApiName = keyof typeof ALL;
export type ApiPath<T extends ApiName> = keyof (typeof ALL)[T];
export type ApiMethod<T extends ApiName, U extends ApiPath<T>> = keyof (typeof ALL)[T][U];

export type Request<
  Name extends ApiName,
  Path extends ApiPath<Name>,
  Method extends ApiMethod<Name, Path>
> = (typeof ALL)[Name][Path][Method] extends {req: infer Req}
  ? Req extends Schema
    ? SchemaToInterface<Req>
    : never
  : never;

export type Response<
  Name extends ApiName,
  Path extends ApiPath<Name>,
  Method extends ApiMethod<Name, Path>
> = (typeof ALL)[Name][Path][Method] extends {res: infer Res}
  ? Res extends Schema
    ? SchemaToInterface<Res>
    : never
  : never;
