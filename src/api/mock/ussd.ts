import { isApiError } from '../errors';
import type { ApiClient, UssdRequest } from '../types';
import { DISPUTE_REASONS, SEED_TRADERS, STOCK_ITEMS } from './seed';
import { formatKes } from './rules';

const CON = (lines: string[]) => `CON ${lines.join('\n')}`;
const END = (lines: string[]) => `END ${lines.join('\n')}`;

const MAIN_MENU = CON([
  'BiasharaFlow (simulated)',
  '1. My limit',
  '2. Restock loan',
  '3. Stock check-in',
  '4. Loan balance',
  '5. Report a problem',
]);

/** Amount choices offered in the borrow menu, as a share of the weekly limit. */
const AMOUNT_SHARES = [1, 0.5, 0.25];

const amountChoices = (limit: number) =>
  AMOUNT_SHARES.map((s) => Math.floor((limit * s) / 100) * 100).filter((a) => a >= 100);

/**
 * Stateless USSD session handler: `text` carries every input so far joined by `*`.
 * Built only on the ApiClient interface, so it follows the same rules as the dashboard.
 */
export async function handleUssd(client: ApiClient, req: UssdRequest): Promise<string> {
  const trader = SEED_TRADERS.find((t) => t.phone === req.phoneNumber);
  if (!trader) return END(['Number not registered.']);
  const id = trader.trader_id;
  const steps = req.text === '' ? [] : req.text.split('*');
  const [menu, pick, confirm] = steps;

  try {
    if (!menu) return MAIN_MENU;

    if (menu === '1') {
      const { weekly_limit } = await client.getLimit(id);
      return END([
        weekly_limit > 0
          ? `Your limit this week is ${formatKes(weekly_limit)}.`
          : 'No restock offer is available this week.',
        'Simulated.',
      ]);
    }

    if (menu === '2') {
      const { weekly_limit } = await client.getLimit(id);
      const choices = amountChoices(weekly_limit);
      if (steps.length === 1) {
        if (choices.length === 0) return END(['No restock offer is available this week.']);
        return CON(['Restock amount:', ...choices.map((a, i) => `${i + 1}. ${formatKes(a)}`)]);
      }
      const amount = choices[Number(pick) - 1];
      if (!amount) return END(['Invalid choice.']);

      if (steps.length === 2) {
        const o = await client.createOffer(id, amount);
        return CON([
          `Restock ${formatKes(o.amount)}`,
          `Fee ${formatKes(o.fee)}`,
          `Total ${formatKes(o.total_payable)}`,
          `Repay ${o.repay_share_of_daily_sales * 100}% of daily sales`,
          `Clear by ${o.estimated_clear_date}`,
          '1. Accept',
          '2. Cancel',
        ]);
      }

      // The offer was created at step 2; act on the trader's latest pending one.
      const pending = (await client.getOffers(id))
        .filter((o) => o.status === 'pending_review')
        .pop();
      if (!pending) return END(['No pending offer. Start again.']);
      if (confirm === '1') {
        const loan = await client.acceptOffer(pending.offer_id);
        return END([
          `Accepted. Loan ${loan.loan_id}.`,
          `Total payable ${formatKes(loan.total_payable)}.`,
          'Simulated.',
        ]);
      }
      if (confirm === '2') {
        await client.declineOffer(pending.offer_id);
        return END(['Cancelled. No loan was created.']);
      }
      return END(['Invalid choice.']);
    }

    if (menu === '3') {
      if (steps.length === 1) {
        return CON(['Item running low:', ...STOCK_ITEMS.map((s, i) => `${i + 1}. ${s}`)]);
      }
      const item = STOCK_ITEMS[Number(pick) - 1];
      if (!item) return END(['Invalid choice.']);
      await client.stockCheckin(id, item);
      return END([`Recorded: ${item} is running low.`]);
    }

    if (menu === '4') {
      const active = (await client.getRepayments(id)).find((l) => l.status === 'active');
      return END([
        active
          ? `Loan ${active.loan_id}: balance ${formatKes(active.balance)} of ${formatKes(active.total_payable)}.`
          : 'You have no active loan.',
      ]);
    }

    if (menu === '5') {
      if (steps.length === 1) {
        return CON(['What is the problem?', ...DISPUTE_REASONS.map((r, i) => `${i + 1}. ${r}`)]);
      }
      const reason = DISPUTE_REASONS[Number(pick) - 1];
      if (!reason) return END(['Invalid choice.']);
      const d = await client.createDispute(id, { reason });
      return END([`Logged ${d.dispute_id}.`, `We reply within ${d.resolve_within_days} days.`]);
    }

    return END(['Invalid choice.']);
  } catch (e) {
    return END([isApiError(e) && e.status < 500 ? e.detail : 'Service unavailable. Try again.']);
  }
}
