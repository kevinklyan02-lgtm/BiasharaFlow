import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppRoutes } from '@/app/routes';
import { formatKes } from '@/lib/format';
import { makeClient, renderApp } from '@/test/render';

beforeEach(() => localStorage.clear());

describe('dashboard', () => {
  it('shows the limit from the API in the stat card and limit card', async () => {
    const client = makeClient();
    const { weekly_limit } = await client.getLimit(101);
    renderApp(<AppRoutes />, { client });

    const statLabel = await screen.findByText('Your Weekly Limit', { selector: 'p' });
    const card = statLabel.closest('div.p-4') as HTMLElement;
    expect(await within(card).findByText(formatKes(weekly_limit))).toBeInTheDocument();
    // The limit card repeats the figure.
    expect(await screen.findAllByText(formatKes(weekly_limit))).toHaveLength(2);
  });

  it('reveals the backend reason behind "Why this limit?"', async () => {
    const client = makeClient();
    const { reason } = await client.getLimit(101);
    const user = userEvent.setup();
    renderApp(<AppRoutes />, { client });

    expect(screen.queryByText(reason)).not.toBeInTheDocument();
    await user.click(await screen.findByRole('button', { name: 'Why this limit?' }));
    expect(screen.getByText(reason)).toBeInTheDocument();
  });

  it('renders all 14 forecast days in the accessible table', async () => {
    renderApp(<AppRoutes />);
    const table = await screen.findByRole('table', { name: /forecast values by day/i });
    expect(within(table).getAllByRole('row')).toHaveLength(15);
    expect(screen.getByRole('img', { name: /14-day sales forecast/i })).toBeInTheDocument();
  });

  it('offers the restock loan when no loan is active', async () => {
    renderApp(<AppRoutes />);
    expect(await screen.findByRole('link', { name: /view offers/i })).toHaveAttribute(
      'href',
      '/offers',
    );
    expect(await screen.findByText('No active loan.')).toBeInTheDocument();
  });

  it('shows loan progress instead of the offer CTA while a loan is active', async () => {
    const client = makeClient();
    const offer = await client.createOffer(101, 10000);
    const loan = await client.acceptOffer(offer.offer_id);
    await client.repay(loan.loan_id, { txn_id: 'X1', daily_sales: 40000 }); // deducts 4,800

    renderApp(<AppRoutes />, { client });
    expect(await screen.findByText('You have a loan in progress.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /view offers/i })).not.toBeInTheDocument();
    expect(await screen.findByText('46%')).toBeInTheDocument(); // 4,800 of 10,500
    expect(screen.getByText('KES 4,800 paid of KES 10,500')).toBeInTheDocument();
    // Today's sales comes from the latest repayment, not the forecast.
    expect(screen.getByText('KES 40,000')).toBeInTheDocument();
  });

  it('shows a no-offer message when the limit is 0', async () => {
    const client = makeClient();
    const real = client.getLimit.bind(client);
    client.getLimit = async (id) => ({ ...(await real(id)), weekly_limit: 0 });
    renderApp(<AppRoutes />, { client });
    expect(await screen.findByText('No offer available this week.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /view offers/i })).not.toBeInTheDocument();
  });

  it("switching trader reloads that trader's numbers", async () => {
    const client = makeClient();
    const user = userEvent.setup();
    renderApp(<AppRoutes />, { client });
    await user.selectOptions(await screen.findByLabelText('Trader'), 'Baraka Kiosk');
    const { weekly_limit } = await client.getLimit(102);
    expect((await screen.findAllByText(formatKes(weekly_limit))).length).toBeGreaterThan(0);
  });

  it('labels the data as simulated', async () => {
    renderApp(<AppRoutes />);
    expect(await screen.findByText(/simulated data/i)).toBeInTheDocument();
  });
});

describe('forecast and limit pages', () => {
  it('forecast page shows insights from the API', async () => {
    const client = makeClient();
    await client.stockCheckin(101, 'Sugar');
    const { suggestion } = await client.getInsights(101);
    renderApp(<AppRoutes />, { client, route: '/forecast' });
    expect(await screen.findByText(suggestion)).toBeInTheDocument();
    expect(screen.getByText('Busiest days')).toBeInTheDocument();
    expect(screen.getByText('1 report')).toBeInTheDocument();
  });

  it('limit page shows the breakdown and a request link', async () => {
    const client = makeClient();
    const l = await client.getLimit(101);
    renderApp(<AppRoutes />, { client, route: '/limit' });
    expect(await screen.findByText(l.reason)).toBeInTheDocument();
    expect(screen.getByText(formatKes(l.low_case_sales_7d))).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Request a restock loan' })).toBeInTheDocument();
  });
});
