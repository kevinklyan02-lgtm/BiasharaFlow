import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/api/errors';
import { AppRoutes } from '@/app/routes';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { a11yViolations } from '@/test/a11y';
import { makeClient, renderApp } from '@/test/render';
import { render } from '@testing-library/react';

beforeEach(() => localStorage.clear());
afterEach(() => vi.unstubAllEnvs());

describe('demo reset', () => {
  it('asks first, then clears data and refreshes the screens', async () => {
    const client = makeClient();
    await client.createOffer(101, 5000);
    const user = userEvent.setup();
    renderApp(<AppRoutes />, { client, route: '/offers' });

    expect(await screen.findByText('O-0001 · KES 5,000')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reset demo data' }));
    expect(screen.getByText(/Clear all offers/)).toBeInTheDocument();
    expect(await client.getOffers(101)).toHaveLength(1); // nothing happened yet

    await user.click(screen.getByRole('button', { name: 'Yes, reset' }));
    expect(await screen.findByText('Demo data cleared.')).toBeInTheDocument();
    expect(await client.getOffers(101)).toEqual([]);
    await waitFor(() => expect(screen.queryByText('O-0001 · KES 5,000')).not.toBeInTheDocument());
    expect(await screen.findByText('No offers yet')).toBeInTheDocument();
  });

  it('can be cancelled', async () => {
    const client = makeClient();
    await client.createOffer(101, 5000);
    const user = userEvent.setup();
    renderApp(<AppRoutes />, { client });
    await user.click(await screen.findByRole('button', { name: 'Reset demo data' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByRole('button', { name: 'Reset demo data' })).toBeInTheDocument();
    expect(await client.getOffers(101)).toHaveLength(1);
  });

  it('explains a 403 from a server that has reset turned off', async () => {
    const client = makeClient();
    client.resetDemo = async () => {
      throw new ApiError(403, 'Demo reset is turned off on this server');
    };
    const user = userEvent.setup();
    renderApp(<AppRoutes />, { client });
    await user.click(await screen.findByRole('button', { name: 'Reset demo data' }));
    await user.click(screen.getByRole('button', { name: 'Yes, reset' }));
    expect(await screen.findByText('Reset is turned off on this server.')).toBeInTheDocument();
  });

  it('is hidden when demo mode is off', async () => {
    vi.stubEnv('VITE_DEMO_MODE', 'false');
    renderApp(<AppRoutes />);
    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByRole('button', { name: 'Reset demo data' })).not.toBeInTheDocument();
  });
});

describe('health indicator', () => {
  it('shows online, and offline when the health check fails', async () => {
    const { unmount } = renderApp(<AppRoutes />);
    expect(await screen.findByText('API online')).toBeInTheDocument();
    unmount();

    const client = makeClient();
    client.health = async () => {
      throw new ApiError(0, 'down');
    };
    renderApp(<AppRoutes />, { client });
    expect(await screen.findByText('API offline')).toBeInTheDocument();
  });
});

describe('error boundary', () => {
  it('shows a message instead of a blank page when a component throws', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    function Boom(): never {
      throw new Error('boom');
    }
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('The page hit a problem');
    spy.mockRestore();
  });
});

describe('navigation aids', () => {
  it('has a skip link and updates the document title per screen', async () => {
    const user = userEvent.setup();
    renderApp(<AppRoutes />);
    expect(await screen.findByRole('link', { name: 'Skip to content' })).toHaveAttribute(
      'href',
      '#main',
    );
    expect(document.title).toBe('Dashboard | BiasharaFlow');
    await user.click(screen.getByRole('link', { name: 'Repayment Progress' }));
    expect(document.title).toBe('Repayment Progress | BiasharaFlow');
  });
});

describe('accessibility (axe)', () => {
  const routes = [
    '/',
    '/forecast',
    '/limit',
    '/offers',
    '/repayments',
    '/problem',
    '/backtest',
    '/ussd',
  ];

  it.each(routes)('%s has no axe violations', async (route) => {
    const client = makeClient();
    const offer = await client.createOffer(101, 5000);
    await client.acceptOffer(offer.offer_id);
    const { container } = renderApp(<AppRoutes />, { client, route });
    await screen.findByRole('heading', { level: 1 });
    await screen.findByRole('heading', { level: 2 });
    // Let data-driven content settle before scanning.
    await waitFor(() => expect(screen.queryByRole('status', { name: /loading/i })).toBeNull());
    expect(await a11yViolations(container)).toEqual([]);
  });
});
