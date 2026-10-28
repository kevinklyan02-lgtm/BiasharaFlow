import type { ReactNode } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { ContractError, errorAction, isApiError, userMessage } from '@/api/errors';
import { ErrorState, Spinner } from './ui';

/** One place that turns a query's state into loading / error / content, per the status policy. */
export function QueryBoundary<T>({
  query,
  loading,
  children,
}: {
  query: UseQueryResult<T>;
  loading?: ReactNode;
  children: (data: T) => ReactNode;
}) {
  if (query.isPending) return <>{loading ?? <Spinner />}</>;

  if (query.isError) {
    const err = query.error;
    const action = errorAction(err);
    if (action === 'not-found') {
      return <ErrorState title="Not found" message={userMessage(err)} />;
    }
    const message =
      err instanceof ContractError
        ? `The server's reply did not match the expected format. ${err.message}`
        : isApiError(err) && err.status === 0
          ? err.detail
          : userMessage(err);
    return <ErrorState message={message} onRetry={() => void query.refetch()} />;
  }

  return <>{children(query.data)}</>;
}
