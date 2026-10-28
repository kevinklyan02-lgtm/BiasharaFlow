import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '@/app/routes';
import { makeClient, renderApp } from '@/test/render';

beforeEach(() => localStorage.clear());
afterEach(() => vi.unstubAllEnvs());

async function clientWithLoan(amount = 10000) {
  const client = makeClient();
  const offer = await client.createOffer(101, amount);
  const loan = await client.acceptOffer(offer.offer_id);
  return { client, loan };
}

async function simulate(user: ReturnType<typeof userEvent.setup>, sales: string) {
  const input = await screen.findByLabelText('Daily sales (KES)');
  await user.clear(input);
  await user.type(input, sales);
  await user.click(screen.getByRole('button', { name: 'Simulate a day of sales' }));
}

describe('repayments page', () => {
  it('shows an empty state with a link to offers when there are no loans', async () => {
    renderApp(<AppRoutes />, { route: '/repayments' });
    expect(await screen.findByText('No loans yet')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'See offers' })).toHaveAttribute('href', '/offers');
  });

  it('shows progress, facts and an empty ledger for a new loan', async () => {
    const { client } = await clientWithLoan();
    renderApp(<AppRoutes />, { client, route: '/repayments' });
    expect(await screen.findByText('Loan L-0001')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Repayment progress' })).toHaveAttribute(
      'aria-valuenow',
      '0',
    );
    expect(screen.getByText('KES 0 paid of KES 10,500')).toBeInTheDocument();
    expect(screen.getByText(/No repayments yet/)).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('simulating a day deducts 12% and updates progress and the ledger', async () => {
    const { client } = await clientWithLoan();
    const user = userEvent.setup();
    renderApp(<AppRoutes />, { client, route: '/repayments' });

    await simulate(user, '8000');
    expect(
      await screen.findByText(/Day recorded\. KES 960 deducted\. Balance KES 9,540\./),
    ).toBeInTheDocument();
    expect(await screen.findByText('KES 960 paid of KES 10,500')).toBeInTheDocument();
    const table = screen.getByRole('table');
    expect(within(table).getByText('KES 8,000')).toBeInTheDocument();
    expect(within(table).getByText('KES 960')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '9');
  });

  it('uses a fresh transaction id per click', async () => {
    const { client } = await clientWithLoan();
    const user = userEvent.setup();
    renderApp(<AppRoutes />, { client, route: '/repayments' });
    await simulate(user, '1000');
    await screen.findByText(/Day recorded/);
    await user.click(screen.getByRole('button', { name: 'Simulate a day of sales' }));
    await screen.findByText('KES 240 paid of KES 10,500');
    expect((await client.getRepayments(101))[0].ledger).toHaveLength(2);
  });

  it('resending the same transaction is reported as a duplicate and changes nothing', async () => {
    const { client } = await clientWithLoan();
    const user = userEvent.setup();
    renderApp(<AppRoutes />, { client, route: '/repayments' });
    await simulate(user, '8000');
    await screen.findByText('KES 960 paid of KES 10,500');

    await user.click(screen.getByRole('button', { name: 'Send the same transaction again' }));
    expect(await screen.findByText(/Duplicate transaction ignored/)).toBeInTheDocument();
    expect(screen.getByText('KES 960 paid of KES 10,500')).toBeInTheDocument();
    expect((await client.getRepayments(101))[0].ledger).toHaveLength(1);
  });

  it('never deducts more than the balance and shows the cleared state', async () => {
    const { client } = await clientWithLoan(1000); // total 1,050
    const user = userEvent.setup();
    renderApp(<AppRoutes />, { client, route: '/repayments' });
    await simulate(user, '1000000');
    expect(await screen.findByText('Fully repaid')).toBeInTheDocument();
    expect(screen.getByText('KES 1,050 paid of KES 1,050')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    // No active loan, so the demo controls are gone.
    expect(screen.queryByLabelText('Daily sales (KES)')).not.toBeInTheDocument();
  });

  it('blocks non-positive sales in the form', async () => {
    const { client } = await clientWithLoan();
    const user = userEvent.setup();
    renderApp(<AppRoutes />, { client, route: '/repayments' });
    const input = await screen.findByLabelText('Daily sales (KES)');
    await user.clear(input);
    await user.type(input, '0');
    expect(screen.getByRole('button', { name: 'Simulate a day of sales' })).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent(/positive whole number/);
  });

  it('hides the demo controls when demo mode is off', async () => {
    vi.stubEnv('VITE_DEMO_MODE', 'false');
    const { client } = await clientWithLoan();
    renderApp(<AppRoutes />, { client, route: '/repayments' });
    expect(await screen.findByText('Loan L-0001')).toBeInTheDocument();
    expect(screen.queryByText('Demo controls')).not.toBeInTheDocument();
  });
});

describe('recent activity on the dashboard', () => {
  it('shows an empty state for a new trader', async () => {
    renderApp(<AppRoutes />);
    expect(await screen.findByText('Nothing yet')).toBeInTheDocument();
  });

  it('lists the offer, then repayments, newest first', async () => {
    const { client, loan } = await clientWithLoan(10000);
    await client.repay(loan.loan_id, { txn_id: 'X1', daily_sales: 8000 });
    renderApp(<AppRoutes />, { client });
    expect(await screen.findByText('Repayment received')).toBeInTheDocument();
    expect(screen.getByText('Loan offer accepted')).toBeInTheDocument();
    expect(screen.getByText(/KES 960 from KES 8,000 sales/)).toBeInTheDocument();
  });
});
