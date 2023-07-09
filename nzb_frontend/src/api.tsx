import {apiCaller} from '@shared/api/core/api_call';

export const apiBackend = apiCaller('backend', fetch);
