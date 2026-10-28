import { beforeEach, describe, expect, it } from 'vitest';
import type { ApiClient } from '../types';
import { createMockClient } from '.';

const NOW = new Date('2026-10-27T10:00:00Z');
const PHONE = '+254700000101';
let api: ApiClient;

const dial = (text: string, phoneNumber = PHONE) =>
  api.ussd({ sessionId: 's1', serviceCode: '*384#', phoneNumber, text });

beforeEach(() => {
  api = createMockClient({ now: () => NOW });
});

describe('USSD', () => {
  it('shows the main menu on an empty text', async () => {
    const reply = await dial('');
    expect(reply).toMatch(/^CON /);
    expect(reply).toMatch(/1\. My limit/);
  });

  it('1 shows the limit and ends', async () => {
    const reply = await dial('1');
    expect(reply).toMatch(/^END .*Your limit this week is KES [\d,]+/);
  });

  it('2*1 shows offer terms with Accept and Cancel, creating a pending offer only', async () => {
    const reply = await dial('2*1');
    expect(reply).toMatch(/^CON /);
    expect(reply).toMatch(/Fee KES/);
    expect(reply).toMatch(/Total KES/);
    expect(reply).toMatch(/Repay 12% of daily sales/);
    expect(reply).toMatch(/1\. Accept/);
    expect(await api.getRepayments(101)).toEqual([]);
    expect((await api.getOffers(101))[0].status).toBe('pending_review');
  });

  it('2*1*1 accepts and creates the loan', async () => {
    await dial('2*1');
    const reply = await dial('2*1*1');
    expect(reply).toMatch(/^END Accepted\. Loan L-0001\./);
    expect((await api.getRepayments(101))[0].status).toBe('active');
  });

  it('2*1*2 cancels without a loan', async () => {
    await dial('2*1');
    expect(await dial('2*1*2')).toMatch(/^END Cancelled/);
    expect(await api.getRepayments(101)).toEqual([]);
    expect((await api.getOffers(101))[0].status).toBe('declined');
  });

  it('a second borrow while a loan is active ends with the 409 detail', async () => {
    await dial('2*1');
    await dial('2*1*1');
    expect(await dial('2*1')).toMatch(/^END You already have an active loan/);
  });

  it('3 lists stock items and 3*2 records one', async () => {
    expect(await dial('3')).toMatch(/^CON Item running low:\n1\. Cooking oil/);
    expect(await dial('3*2')).toMatch(/^END Recorded: Sugar/);
    expect((await api.getInsights(101)).stock_alerts[0].item).toBe('Sugar');
  });

  it('4 reports balance or no active loan', async () => {
    expect(await dial('4')).toMatch(/no active loan/);
    await dial('2*1');
    await dial('2*1*1');
    expect(await dial('4')).toMatch(/^END Loan L-0001: balance KES/);
  });

  it('5*2 logs a dispute', async () => {
    expect(await dial('5')).toMatch(/^CON What is the problem\?/);
    expect(await dial('5*2')).toMatch(/^END Logged D-0001\.\nWe reply within 30 days/);
  });

  it('handles unknown numbers and invalid choices', async () => {
    expect(await dial('', '+254700000999')).toBe('END Number not registered.');
    expect(await dial('9')).toMatch(/^END Invalid choice/);
    expect(await dial('2*9')).toMatch(/^END Invalid choice/);
  });
});
