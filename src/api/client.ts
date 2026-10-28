import { createLiveClient } from './live';
import { createMockClient } from './mock';
import type { ApiClient } from './types';

export interface ApiEnv {
  VITE_API_MODE?: string;
  VITE_API_BASE_URL?: string;
  VITE_DEMO_MODE?: string;
}

/** Picks the adapter from env. Everything else in the app depends on the ApiClient interface only. */
export function createApiClient(env: ApiEnv): ApiClient {
  if (env.VITE_API_MODE === 'live') {
    return createLiveClient({ baseUrl: env.VITE_API_BASE_URL ?? 'http://localhost:8000' });
  }
  return createMockClient({
    storage: typeof localStorage === 'undefined' ? undefined : localStorage,
    latencyMs: 250,
    demoResetEnabled: env.VITE_DEMO_MODE !== 'false',
  });
}

export const api: ApiClient = createApiClient(import.meta.env);
