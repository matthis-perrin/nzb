import {ApiHandler} from '@shared/api/core/api_types';

export const meHandler: ApiHandler<'backend', 'POST /me'> = async req => {
  console.log(req.test);
  await Promise.resolve();
  return {test2: 1};
};

export const meHandler2: ApiHandler<'backend', 'GET /me2'> = async req => {
  console.log(req.test3);
  await Promise.resolve();
  return {test4: '1'};
};
