import { createContext, useContext, type ReactNode } from 'react';
import { api as defaultClient } from './client';
import type { ApiClient } from './types';

const ApiContext = createContext<ApiClient>(defaultClient);

/** Lets tests (and Storybook-style demos) inject a client; the app uses the env-selected one. */
export function ApiProvider({ client, children }: { client: ApiClient; children: ReactNode }) {
  return <ApiContext.Provider value={client}>{children}</ApiContext.Provider>;
}

export const useApi = () => useContext(ApiContext);
