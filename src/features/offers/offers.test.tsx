import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { ApiError } from '@/api/errors';
import { AppRoutes } from '@/app/routes';
import { makeClient, renderApp } from '@/test/render';

beforeEach(() => localStorage.clear());

async function requestOffer(user: ReturnType<typeof userEvent.setup>, amount: string) {
  await user.type(await screen.findByLabelText('Amount (KES)'), amount);
  await user.click(screen.getByRole('button', { name: 'Review offer' }));
}

describe('restock form', () => {
  it('shows the limit and fills the amount from a preset', async () => {
    const client = makeClient();
    const { weekly_limit } = await client.getLimit(101);
    const user = userEvent.setup();
    renderApp(<AppRoutes />, { client, route: '/offers' });

    await user.click(await screen.findByRole('button', { name: /^Full limit/ }));
    expect(screen.getByLabelText('Amount (KES)')).toHaveValue(weekly_limit);
  });

  it('rejects an amount above the limit locally without creating an offer', async () => {
    const client = makeClient();
    const { weekly_limit } = await client.getLimit(101);
    const user = userEvent.setup();
    renderApp(<AppRoutes />, { client, route: '/offers' });

    await requestOffer(user, String(weekly_limit + 1));
    expect(await screen.findByRole('alert')).toHaveTextContent(/between 1 and the limit of KES/);
    expect(await client.getOffers(101)).toEqual([]);
  });

  it('rejects zero and empty input', async () => {
    const user = userEvent.setup();
    renderApp(<AppRoutes />, { route: '/offers' });
    await requestOffer(user, '0');
    expect(await screen.findByRole('alert')).toHaveTextContent(/between 1 and/);
    await user.clear(screen.getByLabelText('Amount (KES)'));
    await user.click(screen.getByRole('button', { name: 'Review offer' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/whole number/);
  });

  it("shows the server's 400 message next to the input when it disagrees", async () => {
    const client = makeClient();
    client.getLimit = async (id) => ({
      ...(await makeClient().getLimit(id)),
      weekly_limit: 90000,
    });
    const user = userEvent.setup();
    renderApp(<AppRoutes />, { client, route: '/offers' });
    await requestOffer(user, '80000');
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /Amount must be between 1 and the limit of KES 22,/,
    );
  });

  it('shows a no-offer state and no form when the limit is 0', async () => {
    const client = makeClient();
    const real = client.getLimit.bind(client);
    client.getLimit = async (id) => ({ ...(await real(id)), weekly_limit: 0 });
    renderApp(<AppRoutes />, { client, route: '/offers' });
    expect(await screen.findByText('No offer available this week')).toBeInTheDocument();
    expect(screen.queryByLabelText('Amount (KES)')).not.toBeInTheDocument();
  });
});

describe('offer review', () => {
  it('shows every term, then accepting creates the loan', async () => {
    const client = makeClient();
    const user = userEvent.setup();
    renderApp(<AppRoutes />, { client, route: '/offers' });

    await requestOffer(user, '12000');
    expect(await screen.findByRole('heading', { name: 'Review your offer' })).toBeInTheDocument();
    expect(await screen.findByText('Amount you receive')).toBeInTheDocument();
    expect(screen.getByText('KES 600')).toBeInTheDocument();
    expect(screen.getAllByText('KES 12,600').length).toBeGreaterThan(0);
    expect(screen.getByText('12% of daily sales')).toBeInTheDocument();
    expect(screen.getByText(/about \d+ days/)).toBeInTheDocument();
    expect(screen.getByText(/SIMULATED: no late charges/)).toBeInTheDocument();
    // Creating an offer must not create a loan.
    expect(await client.getRepayments(101)).toEqual([]);

    await user.click(screen.getByRole('button', { name: 'Accept offer' }));
    expect(await screen.findByText('Offer accepted. Loan L-0001 is active.')).toBeInTheDocument();
    expect((await client.getRepayments(101))[0]).toMatchObject({
      principal: 12000,
      status: 'active',
    });
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Accept offer' })).not.toBeInTheDocument(),
    );
  });

  it('declining leaves no loan', async () => {
    const client = makeClient();
    const user = userEvent.setup();
    renderApp(<AppRoutes />, { client, route: '/offers' });
    await requestOffer(user, '5000');
    await user.click(await screen.findByRole('button', { name: 'Decline' }));
    expect(await screen.findByText(/Offer declined/)).toBeInTheDocument();
    expect(await client.getRepayments(101)).toEqual([]);
    expect((await client.getOffers(101))[0].status).toBe('declined');
  });

  it('shows the backend message when accept returns 409', async () => {
    const client = makeClient();
    const offer = await client.createOffer(101, 5000);
    client.acceptOffer = async () => {
      throw new ApiError(409, 'Offer O-0001 was already accepted');
    };
    const user = userEvent.setup();
    renderApp(<AppRoutes />, { client, route: `/offers/${offer.offer_id}` });
    await user.click(await screen.findByRole('button', { name: 'Accept offer' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Offer O-0001 was already accepted');
  });

  it('shows not-found for an unknown offer id', async () => {
    renderApp(<AppRoutes />, { route: '/offers/O-9999' });
    expect(await screen.findByText('Offer not found')).toBeInTheDocument();
  });

  it('shows a decided offer read-only', async () => {
    const client = makeClient();
    const offer = await client.createOffer(101, 5000);
    await client.declineOffer(offer.offer_id);
    renderApp(<AppRoutes />, { client, route: `/offers/${offer.offer_id}` });
    expect(await screen.findByText('Declined')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Accept offer' })).not.toBeInTheDocument();
  });
});

describe('one active loan', () => {
  it('replaces the form with the current loan', async () => {
    const client = makeClient();
    const offer = await client.createOffer(101, 5000);
    await client.acceptOffer(offer.offer_id);
    renderApp(<AppRoutes />, { client, route: '/offers' });
    expect(await screen.findByText('You already have an active loan')).toBeInTheDocument();
    expect(screen.getByText(/L-0001: KES 0 paid of KES 5,250/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Amount (KES)')).not.toBeInTheDocument();
  });

  it('on a create 409 shows the backend detail with the refreshed loan', async () => {
    const client = makeClient();
    const realCreate = client.createOffer.bind(client);
    const realAccept = client.acceptOffer.bind(client);
    const realRepayments = client.getRepayments.bind(client);
    let loanTaken = false;
    // The page loads before another device takes a loan, so the form is shown first.
    client.getRepayments = async (id) => (loanTaken ? realRepayments(id) : []);
    client.createOffer = async (id, amount) => {
      const other = await realCreate(id, 1000);
      await realAccept(other.offer_id);
      loanTaken = true;
      return realCreate(id, amount); // the mock's genuine 409
    };
    const user = userEvent.setup();
    renderApp(<AppRoutes />, { client, route: '/offers' });
    await requestOffer(user, '2000');
    expect(await screen.findByText('You already have an active loan')).toBeInTheDocument();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /You already have an active loan \(L-0001\)/,
    );
  });
});
