import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Backtest } from '@/api/types';
import { AppRoutes } from '@/app/routes';
import { makeClient, renderApp } from '@/test/render';

beforeEach(() => localStorage.clear());

const real: Backtest = {
  placeholder: false,
  period: 'Friday to Friday',
  traders: 3,
  flat_limit_kes: 15000,
  metrics: {
    stockout_days_avoided: { flat_limit: 4, biasharaflow: 9 },
    interest_saved_kes: { flat_limit: 0, biasharaflow: 3200 },
    share_of_loans_affordable: { flat_limit: 0.55, biasharaflow: 0.92 },
  },
  by_shop_type: [
    { shop_type: 'kiosk', loans: 12, affordable_share: 0.9 },
    { shop_type: 'general', loans: 20, affordable_share: 0.95 },
  ],
};

describe('backtest page', () => {
  it('shows a placeholder banner and no figures while placeholder is true', async () => {
    renderApp(<AppRoutes />, { route: '/backtest' });
    expect(await screen.findByText('Placeholder data')).toBeInTheDocument();
    expect(screen.getAllByText('Awaiting results')).toHaveLength(3);
    // The zero values from the API must never be presented as results.
    expect(screen.queryByText('Flat limit')).not.toBeInTheDocument();
    expect(screen.queryByText('0 days')).not.toBeInTheDocument();
    expect(screen.queryByText('0%')).not.toBeInTheDocument();
  });

  it('shows both values for each metric and the fairness table when real', async () => {
    const client = makeClient();
    client.getBacktest = async () => real;
    renderApp(<AppRoutes />, { client, route: '/backtest' });

    expect(await screen.findByText('9 days')).toBeInTheDocument();
    expect(screen.getByText('4 days')).toBeInTheDocument();
    expect(screen.getByText('KES 3,200')).toBeInTheDocument();
    expect(screen.getByText('92%')).toBeInTheDocument();
    expect(screen.getByText('55%')).toBeInTheDocument();
    expect(screen.queryByText('Placeholder data')).not.toBeInTheDocument();

    const table = screen.getByRole('table');
    expect(within(table).getByText('Shop type')).toBeInTheDocument();
    expect(within(table).getByText('kiosk')).toBeInTheDocument();
    expect(within(table).getAllByRole('row')).toHaveLength(3);
  });

  it('omits the fairness table when there are no rows', async () => {
    const client = makeClient();
    client.getBacktest = async () => ({ ...real, by_shop_type: [] });
    renderApp(<AppRoutes />, { client, route: '/backtest' });
    await screen.findByText('9 days');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
