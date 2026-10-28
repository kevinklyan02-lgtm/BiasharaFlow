import { QueryClient } from '@tanstack/react-query';
import { isApiError } from './errors';

/** Don't retry 4xx (the answer won't change); retry network/5xx twice. */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 15_000,
        refetchOnWindowFocus: false,
        retry: (count, error) =>
          !(isApiError(error) && error.status >= 400 && error.status < 500) && count < 2,
      },
    },
  });
}
