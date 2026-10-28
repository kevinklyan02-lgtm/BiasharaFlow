import type { ZodIssue } from 'zod';

/** An HTTP error response. `detail` is the backend's plain-language message. */
export class ApiError extends Error {
  readonly status: number;
  readonly detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

/** The backend answered 2xx but the body did not match docs/API_CONTRACT.md. */
export class ContractError extends Error {
  readonly endpoint: string;
  readonly issues: ZodIssue[];

  constructor(endpoint: string, issues: ZodIssue[]) {
    const first = issues[0];
    super(
      `[contract] ${endpoint}: ${first ? `${first.path.join('.')} ${first.message}` : 'invalid'}`,
    );
    this.name = 'ContractError';
    this.endpoint = endpoint;
    this.issues = issues;
  }
}

export const isApiError = (e: unknown): e is ApiError => e instanceof ApiError;

/** How the UI should react, per the status table in the contract. */
export type ErrorAction = 'inline' | 'not-found' | 'refetch' | 'dev-warning' | 'retry';

export function errorAction(e: unknown): ErrorAction {
  if (!isApiError(e)) return 'retry';
  if (e.status === 400) return 'inline';
  if (e.status === 404) return 'not-found';
  if (e.status === 409) return 'refetch';
  if (e.status === 422) return 'dev-warning';
  return 'retry';
}

/** Message safe to show a trader. */
export function userMessage(e: unknown): string {
  if (isApiError(e) && e.status < 500) return e.detail;
  return 'Something went wrong. Please try again.';
}
