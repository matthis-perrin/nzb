import {
  AllApiSchema,
  Arr,
  Bool,
  Num,
  Obj,
  OptArr,
  OptNum,
  OptObj,
  OptStr,
  SchemaToType,
  Str,
} from '@shared/api/core/api_schema';
import {ApiConfig, ApiName} from '@shared/api/core/api_types';
import {NZB_BACKEND_FUNCTION_URL} from '@shared/env';

const TestSchema = Obj({
  test1: Str(),
  test2: Num(),
  test3: Bool(),
  test4: Obj({
    test41: OptStr(),
    test42: Obj({
      test421: OptNum(),
    }),
    test43: OptObj({
      test431: Bool(),
    }),
  }),
  test5: Arr(Bool()),
  test6: OptArr(
    Obj({
      test61: Str(),
    })
  ),
});

export type Test = SchemaToType<typeof TestSchema>;

export const ALL = {
  backend: {
    '/me': {
      POST: {
        req: Obj({
          test: OptNum(),
        }),
        res: Obj({
          test2: Num(),
        }),
      },
    },
    '/me2': {
      GET: {
        req: Obj({
          test3: Num(),
        }),
        res: Obj({
          test4: Str(),
        }),
      },
    },
  },
  test: {
    '/foo': {
      GET: {
        res: TestSchema,
      },
    },
  },
} satisfies AllApiSchema;

export const API_CONFIGS = {
  backend: {
    host: NZB_BACKEND_FUNCTION_URL,
  },
  test: {
    host: '',
  },
} satisfies Record<ApiName, ApiConfig>;
