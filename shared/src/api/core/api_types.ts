import {ALL} from '@shared/api/api';
import {Schema, SchemaToType} from '@shared/api/core/api_schema';

export type ApiName = keyof typeof ALL;
export type ApiPath<T extends ApiName> = keyof (typeof ALL)[T];
export type ApiMethod<T extends ApiName, U extends ApiPath<T>> = keyof (typeof ALL)[T][U];

export type Request<
  Name extends ApiName,
  Path extends ApiPath<Name>,
  Method extends ApiMethod<Name, Path>
> = (typeof ALL)[Name][Path][Method] extends {req: infer Req}
  ? Req extends Schema
    ? SchemaToType<Req>
    : never
  : never;

export type Response<
  Name extends ApiName,
  Path extends ApiPath<Name>,
  Method extends ApiMethod<Name, Path>
> = (typeof ALL)[Name][Path][Method] extends {res: infer Res}
  ? Res extends Schema
    ? SchemaToType<Res>
    : never
  : never;

type ForceString<T> = T extends string ? T : never;
type MethodPath<M, P> = `${ForceString<M>} ${ForceString<P>}`;
type GenerateRouteKeys<Name extends ApiName> = {
  [Path in keyof (typeof ALL)[Name]]: {
    [Method in keyof (typeof ALL)[Name][Path]]: MethodPath<Method, Path>;
  };
};
type KeyofKeyof<T> = keyof T | {[K in keyof T]: keyof T[K]}[keyof T];
type StripNever<T> = Pick<T, {[K in keyof T]: [T[K]] extends [never] ? never : K}[keyof T]>;
type Lookup<T, K> = T extends object ? (K extends keyof T ? T[K] : never) : never;
type SimpleFlatten<T> = T extends object
  ? StripNever<{
      [K in KeyofKeyof<T>]:
        | Exclude<K extends keyof T ? T[K] : never, object>
        | {[P in keyof T]: Lookup<T[P], K>}[keyof T];
    }>
  : T;
type ValueOf<T> = T[keyof T];

export type FlatApi<Name extends ApiName> = {
  [Key in ForceString<
    ValueOf<SimpleFlatten<GenerateRouteKeys<Name>>>
  >]: Key extends `${infer Method} ${infer Path}`
    ? {
        // @ts-expect-error
        req: Request<Name, Path, Method>;
        // @ts-expect-error
        res: Response<Name, Path, Method>;
      }
    : never;
};

export type ApiHandler<Name extends ApiName, Endpoint extends keyof FlatApi<Name>> = (
  req: FlatApi<Name>[Endpoint]['req']
) => FlatApi<Name>[Endpoint]['res'] | Promise<FlatApi<Name>[Endpoint]['res']>;

export interface ApiConfig {
  host: string;
}
