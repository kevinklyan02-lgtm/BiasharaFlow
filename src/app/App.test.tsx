import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { ApiError } from '@/api/errors';
import { renderApp, makeClient } from '@/test/render';
import { AppRoutes } from './routes';

beforeEach(() => localStorage.clear());

describe('app shell', () => {
  it('shows the first trader and the main navigation', async () => {
    renderApp(<AppRoutes />);
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Mama Njeri General Store' }),
    ).toBeInTheDocument();
    for (const label of [
      'Dashboard',
      'Forecast Chart',
      'My Limit',
      'Offers',
      'Repayment Progress',
      'Report a Problem',
    ]) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
    }
    expect(screen.getByText('MOCK')).toBeInTheDocument();
  });

  it('switching trader updates the header and persists the choice', async () => {
    const user = userEvent.setup();
    const { unmount } = renderApp(<AppRoutes />);
    await user.selectOptions(await screen.findByLabelText('Trader'), 'Baraka Kiosk');
    expect(screen.getByRole('heading', { level: 1, name: 'Baraka Kiosk' })).toBeInTheDocument();
    unmount();

    renderApp(<AppRoutes />);
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Baraka Kiosk' }),
    ).toBeInTheDocument();
  });

  it('falls back to the first trader when the stored id is unknown', async () => {
    localStorage.setItem('biasharaflow.traderId', '999');
    renderApp(<AppRoutes />);
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Mama Njeri General Store' }),
    ).toBeInTheDocument();
  });

  it('navigates between placeholder screens', async () => {
    const user = userEvent.setup();
    renderApp(<AppRoutes />);
    await user.click(await screen.findByRole('link', { name: 'Offers' }));
    expect(screen.getByRole('heading', { name: 'Offers' })).toBeInTheDocument();
  });

  it('opens and closes the mobile menu', async () => {
    const user = userEvent.setup();
    renderApp(<AppRoutes />);
    await user.click(await screen.findByRole('button', { name: 'Open menu' }));
    expect(screen.getByRole('dialog', { name: 'Menu' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('shows an error with retry when traders fail to load', async () => {
    const client = makeClient();
    let calls = 0;
    client.getTraders = async () => {
      calls += 1;
      if (calls === 1) throw new ApiError(500, 'boom');
      return [{ trader_id: 101, shop_name: 'Mama Njeri General Store', type: 'general' }];
    };
    const user = userEvent.setup();
    renderApp(<AppRoutes />, { client });
    expect(await screen.findByRole('alert')).toHaveTextContent(/try again/i);
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Mama Njeri General Store' }),
    ).toBeInTheDocument();
  });
});
