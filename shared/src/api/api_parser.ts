import {BadRequestError} from '@shared/api/api_errors';
import {Schema, SchemaToInterface} from '@shared/api/api_schema';
import {asArray, asBoolean, asMap, asNumber, asString, neverHappens} from '@shared/type_utils';

export function parseSchema(
  value: unknown,
  schema?: Schema,
  parameterName?: string
): SchemaToInterface<Schema> {
  if (!schema) {
    return undefined;
  }
  if (schema.optional && value === undefined) {
    return undefined;
  }
  const errorPrefix = `${parameterName ?? 'body'}${schema.optional ? '' : ' is required and'} `;
  if (schema.type === 'String') {
    const parsed = asString(value);
    if (parsed === undefined) {
      throw new BadRequestError({userMessage: `${errorPrefix} must be a string`});
    }
    return parsed;
  }
  if (schema.type === 'Number') {
    const parsed = asNumber(value);
    if (parsed === undefined) {
      throw new BadRequestError({userMessage: `${errorPrefix} must be a number`});
    }
    return parsed;
  }
  if (schema.type === 'Boolean') {
    const parsed = asBoolean(value);
    if (parsed === undefined) {
      throw new BadRequestError({userMessage: `${errorPrefix} must be a boolean`});
    }
    return parsed;
  }
  if (schema.type === 'Array') {
    const parsed = asArray(value);
    if (parsed === undefined) {
      throw new BadRequestError({userMessage: `${errorPrefix} must be an array`});
    }
    return parsed.map((v, i) => parseSchema(v, schema.items, `${parameterName}[${i}]`));
  }
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (schema.type === 'Object') {
    const parsed = asMap(value);
    if (parsed === undefined) {
      throw new BadRequestError({userMessage: `${errorPrefix} must be an object`});
    }
    return Object.entries(parsed).map(([k, v]) =>
      parseSchema(
        v,
        schema.properties[k] as Schema,
        parameterName === undefined ? k : `${parameterName}.${k}`
      )
    );
  }

  neverHappens(schema, `Invalid schema type ${(schema as Schema).type}`);
}
