import { describe, expect, it } from 'vitest';
import { ApiError } from './errors';
import { createLiveClient } from './live';
import { createMockClient } from './mock';
import type { ApiClient } from './types';

/**
 * Contract checks, written once and run against both adapters.
 *
 * - Mock: always runs, proving the simulator still honours docs/API_CONTRACT.md.
 * - Live: opt-in. `CONTRACT_BASE_URL=http://localhost:8000 npm run test:contract:live`.
 *   Read-only unless `CONTRACT_MUTATE=1`, which first calls POST /demo/reset and then exercises
 *   the offer, loan, repayment, check-in, dispute and USSD flows. Never point it at real data.
 *
 * The live adapter validates every body with the Zod schemas, so a shape mismatch fails here
 * with a `[contract] METHOD /path: field message` error.
 */
const liveUrl = process.env.CONTRACT_BASE_URL;
const mutate = process.env.CONTRACT_MUTATE === '1';

async function expectStatus(p: Promise<unknown>, status: number) {
  const err = await p.then(
    () => null,
    (e: unknown) => e,
  );
  expect(err, `expected HTTP ${status}`).toBeInstanceOf(ApiError);
  expect((err as ApiError).status).toBe(status);
}

function contract(label: string, make: () => ApiClient, canMutate: boolean) {
  describe(`contract: ${label}`, () => {
    it('GET /health and /backtest/summary', async () => {
      const api = make();
      await api.health();
      const b = await api.getBacktest();
      if (b.placeholder) {
        expect(b.metrics.stockout_days_avoided).toEqual({ flat_limit: 0, biasharaflow: 0 });
      }
    });

    it('read endpoints match the schemas for every trader', async () => {
      const api = make();
      const traders = await api.getTraders();
      expect(traders.length).toBeGreaterThan(0);
      for (const { trader_id: id } of traders) {
        const forecast = await api.getForecast(id);
        expect(forecast.forecast).toHaveLength(14);
        for (const p of forecast.forecast) {
          expect(p.low).toBeLessThanOrEqual(p.expected_sales);
          expect(p.expected_sales).toBeLessThanOrEqual(p.high);
        }
        const limit = await api.getLimit(id);
        expect(Number.isInteger(limit.weekly_limit)).toBe(true);
        expect(limit.reason.length).toBeGreaterThan(0);
        await api.getInsights(id);
        await api.getRepayments(id);
        await api.getOffers(id);
        await api.getDisputes(id);
      }
    });

    it('unknown trader returns 404', async () => {
      await expectStatus(make().getLimit(999999), 404);
    });

    it.skipIf(!canMutate)('offer, accept, repay, check-in, dispute and USSD flows', async () => {
      const api = make();
      const reset = await api.resetDemo().catch((e: unknown) => e);
      expect(reset, 'POST /demo/reset must be enabled to run mutating checks').toEqual({
        reset: true,
      });

      const [{ trader_id: id }] = await api.getTraders();
      const { weekly_limit } = await api.getLimit(id);
      expect(weekly_limit).toBeGreaterThan(0);

      await expectStatus(api.createOffer(id, weekly_limit + 1), 400);

      const offer = await api.createOffer(id, 1000);
      expect(offer).toMatchObject({ amount: 1000, status: 'pending_review' });
      expect(await api.getRepayments(id)).toEqual([]); // an offer is not a loan

      const loan = await api.acceptOffer(offer.offer_id);
      expect(loan).toMatchObject({ principal: 1000, repaid: 0, status: 'active' });
      await expectStatus(api.acceptOffer(offer.offer_id), 409);
      await expectStatus(api.createOffer(id, 1000), 409); // one active loan per trader

      const first = await api.repay(loan.loan_id, { txn_id: 'CONTRACT-1', daily_sales: 5000 });
      expect(first.duplicate).toBe(false);
      const again = await api.repay(loan.loan_id, { txn_id: 'CONTRACT-1', daily_sales: 5000 });
      expect(again.duplicate).toBe(true);
      expect(again.loan.repaid).toBe(first.loan.repaid);

      await api.stockCheckin(id, 'Sugar');
      const dispute = await api.createDispute(id, { reason: 'Double deduction' });
      expect(dispute.resolve_within_days).toBe(30);

      const phone = { sessionId: 'contract', serviceCode: '*384#', phoneNumber: '+254700000101' };
      expect(await api.ussd({ ...phone, text: '' })).toMatch(/^CON /);
      expect(await api.ussd({ ...phone, text: '1' })).toMatch(/^END /);

      expect(await api.resetDemo()).toEqual({ reset: true });
      expect(await api.getOffers(id)).toEqual([]);
    });
  });
}

contract('mock', () => createMockClient({ now: () => new Date('2026-10-27T10:00:00Z') }), true);

if (liveUrl) {
  contract('live', () => createLiveClient({ baseUrl: liveUrl }), mutate);
} else {
  describe('contract: live', () => {
    it.skip('set CONTRACT_BASE_URL to run against a real backend', () => {});
  });
}
