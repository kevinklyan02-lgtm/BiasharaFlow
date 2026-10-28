import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { ApiError } from '@/api/errors';
import { AppRoutes } from '@/app/routes';
import { makeClient, renderApp } from '@/test/render';

beforeEach(() => localStorage.clear());

describe('stock check-in', () => {
  it('needs an item before it can be sent', async () => {
    renderApp(<AppRoutes />, { route: '/forecast' });
    expect(await screen.findByRole('button', { name: 'Report running low' })).toBeDisabled();
  });

  it('records the chosen item and updates the insights', async () => {
    const client = makeClient();
    const user = userEvent.setup();
    renderApp(<AppRoutes />, { client, route: '/forecast' });

    await user.click(await screen.findByRole('radio', { name: 'Sugar' }));
    expect(screen.getByRole('radio', { name: 'Sugar' })).toHaveAttribute('aria-checked', 'true');
    await user.click(screen.getByRole('button', { name: 'Report running low' }));

    expect(await screen.findByText('Recorded: Sugar is running low.')).toBeInTheDocument();
    expect((await client.getInsights(101)).stock_alerts).toEqual([{ item: 'Sugar', reports: 1 }]);
    // The insights panel refetched and now lists it.
    expect(await screen.findByText('1 report')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Report running low' })).toBeDisabled();
  });

  it('shows the error when the check-in fails', async () => {
    const client = makeClient();
    client.stockCheckin = async () => {
      throw new ApiError(500, 'boom');
    };
    const user = userEvent.setup();
    renderApp(<AppRoutes />, { client, route: '/forecast' });
    await user.click(await screen.findByRole('radio', { name: 'Rice' }));
    await user.click(screen.getByRole('button', { name: 'Report running low' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/try again/i);
  });
});

describe('report a problem', () => {
  it('requires a reason', async () => {
    const client = makeClient();
    const user = userEvent.setup();
    renderApp(<AppRoutes />, { client, route: '/problem' });
    await user.click(await screen.findByRole('button', { name: 'Send report' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Choose what went wrong.');
    expect(await client.getDisputes(101)).toEqual([]);
  });

  it('shows the reference and the 30-day note, and adds it to the history', async () => {
    const client = makeClient();
    const user = userEvent.setup();
    renderApp(<AppRoutes />, { client, route: '/problem' });

    await user.click(await screen.findByRole('radio', { name: 'Double deduction' }));
    await user.click(screen.getByRole('button', { name: 'Send report' }));

    expect(
      await screen.findByText('Report received. Your reference is D-0001.'),
    ).toBeInTheDocument();
    expect(screen.getByText(/respond within 30 days/)).toBeInTheDocument();
    const history = screen.getByText('Your reports').closest('div') as HTMLElement;
    expect(await within(history).findByText('D-0001 · Double deduction')).toBeInTheDocument();
    expect(await client.getDisputes(101)).toHaveLength(1);
  });

  it('attaches the chosen loan', async () => {
    const client = makeClient();
    const offer = await client.createOffer(101, 5000);
    await client.acceptOffer(offer.offer_id);
    const user = userEvent.setup();
    renderApp(<AppRoutes />, { client, route: '/problem' });

    await user.selectOptions(await screen.findByLabelText('Which loan? (optional)'), 'L-0001');
    await user.click(screen.getByRole('radio', { name: 'Wrong balance' }));
    await user.click(screen.getByRole('button', { name: 'Send report' }));
    await screen.findByText(/Your reference is D-0001/);
    expect((await client.getDisputes(101))[0]).toMatchObject({
      loan_id: 'L-0001',
      reason: 'Wrong balance',
    });
  });

  it('hides the loan picker when the trader has no loans', async () => {
    renderApp(<AppRoutes />, { route: '/problem' });
    await screen.findByRole('button', { name: 'Send report' });
    expect(screen.queryByLabelText('Which loan? (optional)')).not.toBeInTheDocument();
  });

  it('shows the server error when the report fails', async () => {
    const client = makeClient();
    client.createDispute = async () => {
      throw new ApiError(404, 'Loan L-9 not found');
    };
    const user = userEvent.setup();
    renderApp(<AppRoutes />, { client, route: '/problem' });
    await user.click(await screen.findByRole('radio', { name: 'Other' }));
    await user.click(screen.getByRole('button', { name: 'Send report' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Loan L-9 not found');
  });
});
