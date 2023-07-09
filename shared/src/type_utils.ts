function notUndefined<T>(val: T | undefined): val is T {
  return val !== undefined;
}

export function isString(val: unknown): val is string {
  return typeof val === 'string';
}

export function isNumber(val: unknown): val is number {
  return typeof val === 'number';
}

export function removeUndefined<T>(arr: (T | undefined)[]): T[] {
  return arr.filter(notUndefined);
}
export function* filterUndefined<T>(it: Iterator<T | undefined>): Iterator<T> {
  while (true) {
    const val = it.next();
    if (val.done) {
      break;
    }
    if (val.value === undefined) {
      continue;
    }
    yield val.value;
  }
}

export function neverHappens(value: never, errorMessage?: string): never {
  throw new Error(errorMessage);
}

export type AnyMap = Record<string, unknown>;
export function asMap(value: unknown): AnyMap | undefined;
export function asMap(value: unknown, defaultValue: AnyMap): AnyMap;
export function asMap(value: unknown, defaultValue?: AnyMap): AnyMap | undefined {
  // eslint-disable-next-line no-null/no-null
  return typeof value === 'object' && value !== null ? (value as AnyMap) : defaultValue;
}
export function asMapOrThrow(value: unknown): Record<string, unknown> {
  const valueAsMap = asMap(value);
  if (valueAsMap === undefined) {
    throw new Error(`Invalid value: \`${String(value)}\` is not a map`);
  }
  return valueAsMap;
}

export function asString(value: unknown): string | undefined;
export function asString(value: unknown, defaultValue: string): string;
export function asString(value: unknown, defaultValue?: string): string | undefined {
  return typeof value === 'string' ? value : defaultValue;
}
export function asStringOrThrow(value: unknown): string {
  const valueAsString = asString(value);
  if (valueAsString === undefined) {
    throw new Error(`Invalid value: \`${String(value)}\` is not a string`);
  }
  return valueAsString;
}

export function asArray<T = unknown>(value: unknown): T[] | undefined;
export function asArray<T = unknown>(value: unknown, defaultValue: T[]): T[];
export function asArray<T = unknown>(value: unknown, defaultValue?: T[]): T[] | undefined {
  return Array.isArray(value) ? (value as T[]) : defaultValue;
}
export function asArrayOrThrow<T = unknown>(value: unknown): T[] {
  if (!Array.isArray(value)) {
    throw new Error(`Invalid value: \`${String(value)}\` is not an array`);
  }
  return value as T[];
}

export function asStringArray(value: unknown): string[] | undefined;
export function asStringArray(value: unknown, defaultValue: string[]): string[];
export function asStringArray(value: unknown, defaultValue?: string[]): string[] | undefined {
  const arr = asArray(value);
  if (arr === undefined) {
    return defaultValue;
  }
  return removeUndefined(arr.map(s => asString(s)));
}

export function asMapArray(value: unknown): AnyMap[] | undefined;
export function asMapArray(value: unknown, defaultValue: AnyMap[]): AnyMap[];
export function asMapArray(value: unknown, defaultValue?: AnyMap[]): AnyMap[] | undefined {
  const arr = asArray(value);
  if (arr === undefined) {
    return defaultValue;
  }
  return removeUndefined(arr.map(s => asMap(s)));
}
export function asMapArrayOrThrow(value: unknown): AnyMap[] {
  const arr = asArrayOrThrow(value);
  return arr.map(s => asMapOrThrow(s));
}

export function asNumber(value: unknown): number | undefined;
export function asNumber(value: unknown, defaultValue: number): number;
export function asNumber(value: unknown, defaultValue?: number): number | undefined {
  if (typeof value === 'number') {
    return !isNaN(value) ? value : defaultValue;
  }
  if (typeof value === 'string') {
    try {
      const parsedValue = parseFloat(value);
      return !isNaN(parsedValue) ? parsedValue : defaultValue;
    } catch {
      return defaultValue;
    }
  }
  return defaultValue;
}
export function asNumberOrThrow(value: unknown): number {
  const valueAsNumber = asNumber(value);
  if (valueAsNumber === undefined) {
    throw new Error(`Invalid value: \`${String(value)}\` is not a number`);
  }
  return valueAsNumber;
}

export function asBoolean(value: unknown): boolean | undefined;
export function asBoolean(value: unknown, defaultValue: boolean): boolean;
export function asBoolean(value: unknown, defaultValue?: boolean): boolean | undefined {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return !isNaN(value) ? value !== 0 : false;
  }
  if (typeof value === 'string') {
    if (value === '0' || value === 'false') {
      return false;
    } else if (value === '1' || value === 'true') {
      return true;
    }
    return defaultValue;
  }
  return defaultValue;
}

export function asBooleanOrThrow(value: unknown): boolean {
  const valueAsBoolean = asBoolean(value);
  if (valueAsBoolean === undefined) {
    throw new Error(`Invalid value: \`${String(value)}\` is not a boolean`);
  }
  return valueAsBoolean;
}
export function asJson(value: string): AnyMap | undefined;
export function asJson(value: string, defaultValue: AnyMap): AnyMap;
export function asJson(value: string, defaultValue?: AnyMap): AnyMap | undefined {
  try {
    const json = JSON.parse(value);
    const res = asMap(json);
    return res ?? defaultValue;
  } catch {
    return defaultValue;
  }
}
export function asJsonOrThrow(value: string): AnyMap {
  const valueAsJson = asJson(value);
  if (valueAsJson === undefined) {
    throw new Error(`Invalid value: \`${String(value)}\` is not a valid JSON string of a map`);
  }
  return valueAsJson;
}

// export function asDate(value: unknown): Date | undefined;
// export function asDate(value: unknown, defaultValue: Date): Date;
// export function asDate(value: unknown, defaultValue?: Date): Date | undefined {
//   if (typeof value === 'number') {
//     return new Date(value);
//   }
//   return value instanceof Date ? value : defaultValue;
// }

export function isNull<T>(val: T | null): val is null {
  // eslint-disable-next-line no-null/no-null
  return val === null;
}

export function errorAsString(err: unknown): string {
  const errorMap = asMap(err);
  if (errorMap === undefined) {
    return asString(err) ?? String(err);
  }

  const errorMessage = asString(errorMap['message']);
  if (errorMessage === undefined) {
    return String(err);
  }
  return errorMessage;
}

export function errorAndStackAsString(err: unknown): string {
  const errorMap = asMap(err);
  if (errorMap === undefined) {
    return asString(err) ?? String(err);
  }

  const stack = asString(errorMap['stack']);
  if (stack === undefined) {
    return String(err);
  }
  return stack;
}

// export function asParsedJson<T>(json: string): T {
//   try {
//     return JSON.parse(json) as T;
//   } catch {
//     const defaultValue = {};
//     return defaultValue as T;
//   }
// }
export function parseJson(
  json: string
): {res: unknown; err: undefined} | {res: undefined; err: unknown} {
  try {
    return {res: JSON.parse(json), err: undefined};
  } catch (err: unknown) {
    return {err, res: undefined};
  }
}

export function tryParse<T>(data: unknown, parser: (data: unknown) => T): T | undefined {
  try {
    return parser(data);
  } catch {
    return undefined;
  }
}

export type Brand<Type, Name> = Type & {__brand: Name};
export type Untrusted<T> = T extends
  | Function
  | Date
  | boolean
  | number
  | string
  | undefined
  | null
  | unknown[]
  ? unknown
  : {[P in keyof T]?: Untrusted<T[P]>};

export type DeepPartial<T> = T extends
  | Function
  | Date
  | boolean
  | number
  | string
  | undefined
  | null
  | unknown[]
  ? T
  : {[P in keyof T]?: DeepPartial<T[P]>};

export type MapInterface<I, Type> = {[Key in keyof I]: Type};
// Get all the keys of a type including the optional attributes
type NonHomomorphicKeys<T> = ({[P in keyof T]: P} & None)[keyof T];
export type MapInterfaceStrict<I, Type> = {
  [Key in NonHomomorphicKeys<I>]: Type;
};

type KeysOfType<T, Type> = {
  [Key in keyof T]: T[Key] extends Type ? Key : never;
}[keyof T];
export type RestrictInterface<T, Type> = Pick<T, KeysOfType<T, Type>>;

interface RecursiveArray<T> extends Array<T | RecursiveArray<T>> {}
export type NestedArray<T> = (T | RecursiveArray<T>)[];

// Type for an empty object (ie: {})
export type None = Record<string, never>;

export type NonEmptyArray<T> = [T, ...T[]];
