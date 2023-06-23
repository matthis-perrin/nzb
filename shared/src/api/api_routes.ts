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
  Schema,
  Str,
} from '@shared/api/api_schema';

const Test = Obj({
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
  },
  test: {
    '/foo': {
      GET: {
        res: Test,
      },
    },
  },
} satisfies AllApiSchema;
