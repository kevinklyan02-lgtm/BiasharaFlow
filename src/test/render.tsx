import type { ReactElement } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ApiProvider } from '@/api/ApiProvider';
import { createQueryClient } from '@/api/queryClient';
import type { ApiClient } from '@/api/types';
import { createMockClient } from '@/api/mock';
import { TraderProvider } from '@/features/traders/TraderContext';

/** Fixed clock so forecasts and limits are identical in every test run. */
export const TEST_NOW = new Date('2026-10-27T10:00:00Z');

export const makeClient = () => createMockClient({ now: () => TEST_NOW });

/** Renders `ui` with a fresh query cache, router, API client and selected trader. */
export function renderApp(
  ui: ReactElement,
  { client = makeClient(), route = '/' }: { client?: ApiClient; route?: string } = {},
) {
  const queryClient = createQueryClient();
  queryClient.setDefaultOptions({ queries: { retry: false } });
  const result = render(
    <ApiProvider client={client}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>
          <TraderProvider>{ui}</TraderProvider>
        </MemoryRouter>
      </QueryClientProvider>
    </ApiProvider>,
  );
  return { client, queryClient, ...result };
}
