interface SchemaBase {
  description?: string;
}

/* eslint-disable @typescript-eslint/naming-convention */
interface StringSchema extends SchemaBase {
  type: 'String';
  optional: false;
}
export function Str(): StringSchema {
  return {type: 'String', optional: false};
}

interface OptStringSchema extends SchemaBase {
  type: 'String';
  optional: true;
}
export function OptStr(): OptStringSchema {
  return {type: 'String', optional: true};
}

interface NumberSchema extends SchemaBase {
  type: 'Number';
  optional: false;
}
export function Num(): NumberSchema {
  return {type: 'Number', optional: false};
}

interface OptNumberSchema extends SchemaBase {
  type: 'Number';
  optional: true;
}
export function OptNum(): OptNumberSchema {
  return {type: 'Number', optional: true};
}

interface BooleanSchema extends SchemaBase {
  type: 'Boolean';
  optional: false;
}
export function Bool(): BooleanSchema {
  return {type: 'Boolean', optional: false};
}

interface OptBooleanSchema extends SchemaBase {
  type: 'Boolean';
  optional: true;
}
export function OptBool(): OptBooleanSchema {
  return {type: 'Boolean', optional: true};
}

interface ObjectSchema<T extends Record<string, Schema>> extends SchemaBase {
  type: 'Object';
  properties: T;
  optional: false;
}
export function Obj<T extends Record<string, Schema>>(schema: T): ObjectSchema<T> {
  return {type: 'Object', properties: schema, optional: false};
}

interface OptObjectSchema<T extends Record<string, Schema>> extends SchemaBase {
  type: 'Object';
  properties: T;
  optional: true;
}
export function OptObj<T extends Record<string, Schema>>(schema: T): OptObjectSchema<T> {
  return {type: 'Object', properties: schema, optional: true};
}

interface ArraySchema<T extends Schema> extends SchemaBase {
  type: 'Array';
  items: T;
  optional: false;
}
export function Arr<T extends Schema>(schema: T): ArraySchema<T> {
  return {type: 'Array', items: schema, optional: false};
}

interface OptArraySchema<T extends Schema> extends SchemaBase {
  type: 'Array';
  items: T;
  optional: true;
}
export function OptArr<T extends Schema>(schema: T): OptArraySchema<T> {
  return {type: 'Array', items: schema, optional: true};
}
/* eslint-enable @typescript-eslint/naming-convention */

export type Schema =
  | StringSchema
  | OptStringSchema
  | NumberSchema
  | OptNumberSchema
  | BooleanSchema
  | OptBooleanSchema
  | ArraySchema<Schema>
  | OptArraySchema<Schema>
  | ObjectSchema<Record<string, Schema>>
  | OptObjectSchema<Record<string, Schema>>;

export type SchemaToType<T extends Schema> = T extends StringSchema
  ? string
  : T extends OptStringSchema
  ? string | undefined
  : T extends NumberSchema
  ? number
  : T extends OptNumberSchema
  ? number | undefined
  : T extends BooleanSchema
  ? boolean
  : T extends OptBooleanSchema
  ? boolean | undefined
  : T extends ArraySchema<infer Item>
  ? SchemaToType<Item>[]
  : T extends OptArraySchema<infer Item>
  ? SchemaToType<Item>[] | undefined
  : T extends ObjectSchema<infer Properties>
  ? {
      [Key in keyof Properties]: SchemaToType<Properties[Key]>;
    }
  : T extends OptObjectSchema<infer Properties>
  ?
      | {
          [Key in keyof Properties]: SchemaToType<Properties[Key]>;
        }
      | undefined
  : undefined;

export type AllApiSchema = Record<
  string,
  Record<string, Record<string, {req?: Schema; res?: Schema}>>
>;
