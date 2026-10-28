import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { ApiError } from '@/api/errors';
import { qk } from '@/api/keys';
import { AppRoutes } from '@/app/routes';
import { makeClient, renderApp } from '@/test/render';

beforeEach(() => localStorage.clear());

const screenEl = () => screen.getByLabelText('Phone screen');
/** The request log repeats every reply, so assertions about the phone display stay inside it. */
const onPhone = () => within(screenEl());

async function press(user: ReturnType<typeof userEvent.setup>, key: string) {
  await user.type(await screen.findByLabelText('USSD input'), key);
  await user.click(screen.getByRole('button', { name: 'Send' }));
}

describe('USSD phone', () => {
  it('dials and shows the main menu without the CON prefix', async () => {
    const user = userEvent.setup();
    renderApp(<AppRoutes />, { route: '/ussd' });
    await user.click(await screen.findByRole('button', { name: 'Dial' }));
    expect(await onPhone().findByText(/1\. My limit/)).toBeInTheDocument();
    expect(screenEl()).not.toHaveTextContent('CON');
    expect(screen.getByLabelText('USSD input')).toBeInTheDocument();
  });

  it('shows the limit and closes the session on END', async () => {
    const client = makeClient();
    const { weekly_limit } = await client.getLimit(101);
    const user = userEvent.setup();
    renderApp(<AppRoutes />, { client, route: '/ussd' });

    await user.click(await screen.findByRole('button', { name: 'Dial' }));
    await press(user, '1');
    expect(
      await onPhone().findByText(
        new RegExp(`limit this week is KES ${weekly_limit.toLocaleString()}`),
      ),
    ).toBeInTheDocument();
    expect(screenEl()).not.toHaveTextContent('END');
    expect(screen.getByText('Session ended.')).toBeInTheDocument();
    expect(screen.queryByLabelText('USSD input')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dial again' })).toBeInTheDocument();
  });

  it('2, 1, 1 accepts a loan through the real handler and the dashboard sees it', async () => {
    const client = makeClient();
    const user = userEvent.setup();
    const { queryClient } = renderApp(<AppRoutes />, { client, route: '/ussd' });

    // The dashboard already holds the trader's loans; a USSD loan must invalidate that cache.
    await queryClient.prefetchQuery({
      queryKey: qk.repayments(101),
      queryFn: () => client.getRepayments(101),
    });
    expect(queryClient.getQueryState(qk.repayments(101))?.isInvalidated).toBe(false);

    await user.click(await screen.findByRole('button', { name: 'Dial' }));
    await press(user, '2');
    expect(await onPhone().findByText(/Restock amount:/)).toBeInTheDocument();
    await press(user, '1');
    expect(await onPhone().findByText(/1\. Accept/)).toBeInTheDocument();
    expect(screenEl()).toHaveTextContent(/Fee KES/);
    expect(await client.getRepayments(101)).toEqual([]); // terms shown, no loan yet
    await press(user, '1');
    expect(await onPhone().findByText(/Accepted\. Loan L-0001\./)).toBeInTheDocument();
    expect((await client.getRepayments(101))[0].status).toBe('active');
    expect(queryClient.getQueryState(qk.repayments(101))?.isInvalidated).toBe(true);
  });

  it('logs each request with the joined text', async () => {
    const user = userEvent.setup();
    renderApp(<AppRoutes />, { route: '/ussd' });
    await user.click(await screen.findByRole('button', { name: 'Dial' }));
    await press(user, '2');
    await onPhone().findByText(/Restock amount:/);
    await press(user, '1');
    await onPhone().findByText(/1\. Accept/);

    const log = screen.getByText('Request log').closest('div') as HTMLElement;
    expect(within(log).getByText('(empty)')).toBeInTheDocument();
    expect(within(log).getByText('2*1')).toBeInTheDocument();
  });

  it('only accepts digits in the input', async () => {
    const user = userEvent.setup();
    renderApp(<AppRoutes />, { route: '/ussd' });
    await user.click(await screen.findByRole('button', { name: 'Dial' }));
    await user.type(await screen.findByLabelText('USSD input'), 'a1b');
    expect(screen.getByLabelText('USSD input')).toHaveValue('1');
  });

  it('shows the 409 detail from the backend as the final screen', async () => {
    const client = makeClient();
    const o = await client.createOffer(101, 5000);
    await client.acceptOffer(o.offer_id);
    const user = userEvent.setup();
    renderApp(<AppRoutes />, { client, route: '/ussd' });
    await user.click(await screen.findByRole('button', { name: 'Dial' }));
    await press(user, '2');
    await press(user, '1');
    expect(await onPhone().findByText(/already have an active loan/)).toBeInTheDocument();
    expect(screen.getByText('Session ended.')).toBeInTheDocument();
  });

  it('shows a friendly end screen if the request itself fails', async () => {
    const client = makeClient();
    client.ussd = async () => {
      throw new ApiError(0, 'Cannot reach the server. Check your connection and try again.');
    };
    const user = userEvent.setup();
    renderApp(<AppRoutes />, { client, route: '/ussd' });
    await user.click(await screen.findByRole('button', { name: 'Dial' }));
    expect(await onPhone().findByText(/Something went wrong|Cannot reach/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dial again' })).toBeInTheDocument();
  });

  it("uses the selected trader's phone number and resets on switch", async () => {
    const user = userEvent.setup();
    renderApp(<AppRoutes />, { route: '/ussd' });
    expect(await screen.findByText(/\+254700000101/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Dial' }));
    await onPhone().findByText(/1\. My limit/);

    await user.selectOptions(screen.getByLabelText('Trader'), 'Baraka Kiosk');
    expect(await screen.findByText(/\+254700000102/)).toBeInTheDocument();
    expect(screen.getByText('Press Dial to start.')).toBeInTheDocument();
  });
});
