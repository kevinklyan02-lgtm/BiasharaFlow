import type { ZodType } from 'zod';
import { ApiError, ContractError } from './errors';
import * as S from './schemas';
import type { ApiClient } from './types';

export interface LiveOptions {
  baseUrl: string;
  fetchImpl?: typeof fetch;
}

/** Real backend adapter: plain fetch, every JSON body validated against the contract. */
export function createLiveClient({ baseUrl, fetchImpl }: LiveOptions): ApiClient {
  const base = baseUrl.replace(/\/+$/, '');
  const doFetch = (...args: Parameters<typeof fetch>) => (fetchImpl ?? fetch)(...args);

  async function send(method: string, path: string, init: RequestInit = {}): Promise<Response> {
    let res: Response;
    try {
      res = await doFetch(`${base}${path}`, { method, ...init });
    } catch {
      throw new ApiError(0, 'Cannot reach the server. Check your connection and try again.');
    }
    if (!res.ok) {
      let detail = res.statusText || `Request failed (${res.status})`;
      try {
        const body = (await res.json()) as { detail?: unknown };
        if (typeof body.detail === 'string') detail = body.detail;
        // FastAPI 422 sends a list of issues; keep a readable summary for developers.
        else if (Array.isArray(body.detail)) detail = JSON.stringify(body.detail);
      } catch {
        /* non-JSON error body: keep the status text */
      }
      throw new ApiError(res.status, detail);
    }
    return res;
  }

  async function json<T>(
    schema: ZodType<T>,
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const res = await send(
      method,
      path,
      body === undefined
        ? {}
        : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    );
    const parsed = schema.safeParse(await res.json());
    if (!parsed.success) {
      const err = new ContractError(`${method} ${path}`, parsed.error.issues);
      console.warn(err.message, parsed.error.issues);
      throw err;
    }
    return parsed.data;
  }

  const t = (id: number) => `/traders/${id}`;

  return {
    mode: 'live',
    getTraders: () => json(S.TradersSchema, 'GET', '/traders'),
    getForecast: (id) => json(S.ForecastSchema, 'GET', `${t(id)}/forecast`),
    getLimit: (id) => json(S.LimitSchema, 'GET', `${t(id)}/limit`),
    createOffer: (id, amount) => json(S.OfferSchema, 'POST', `${t(id)}/offer`, { amount }),
    acceptOffer: (offerId) => json(S.LoanSchema, 'POST', `/offers/${offerId}/accept`),
    declineOffer: (offerId) => json(S.OfferSchema, 'POST', `/offers/${offerId}/decline`),
    getRepayments: (id) => json(S.LoansSchema, 'GET', `${t(id)}/repayments`),
    repay: (loanId, body) => json(S.RepayResponseSchema, 'POST', `/loans/${loanId}/repay`, body),
    stockCheckin: (id, item) =>
      json(S.StockCheckinSchema, 'POST', `${t(id)}/stock-checkin`, { item }),
    createDispute: (id, body) => json(S.DisputeSchema, 'POST', `${t(id)}/disputes`, body),
    getInsights: (id) => json(S.InsightsSchema, 'GET', `${t(id)}/insights`),
    getBacktest: () => json(S.BacktestSchema, 'GET', '/backtest/summary'),
    getOffers: (id) => json(S.OffersSchema, 'GET', `${t(id)}/offers`),
    getDisputes: (id) => json(S.DisputesSchema, 'GET', `${t(id)}/disputes`),
    resetDemo: () => json(S.ResetResponseSchema, 'POST', '/demo/reset'),
    health: async () => {
      const res = await send('GET', '/health');
      return (await res.json()) as Record<string, unknown>;
    },
    ussd: async (body) => {
      const res = await send('POST', '/ussd', {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ ...body }).toString(),
      });
      return res.text();
    },
  };
}
