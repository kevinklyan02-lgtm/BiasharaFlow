import { describe, expect, it, vi } from 'vitest';
import { ApiError, ContractError, errorAction, userMessage } from './errors';
import { createLiveClient } from './live';

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const make = (fetchImpl: typeof fetch) =>
  createLiveClient({ baseUrl: 'http://api.test/', fetchImpl });

describe('live adapter', () => {
  it('calls the documented path and parses the response', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse([{ trader_id: 101, shop_name: 'Mama Njeri General Store', type: 'general' }]),
    );
    const traders = await make(fetchImpl as unknown as typeof fetch).getTraders();
    expect(traders[0].trader_id).toBe(101);
    expect(fetchImpl).toHaveBeenCalledWith('http://api.test/traders', { method: 'GET' });
  });

  it('sends JSON for offers', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({}, 400));
    await make(fetchImpl as unknown as typeof fetch)
      .createOffer(101, 12000)
      .catch(() => undefined);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('http://api.test/traders/101/offer');
    expect(init.method).toBe('POST');
    expect(init.body).toBe('{"amount":12000}');
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
  });

  it('turns an error body into an ApiError with the detail message', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse({ detail: 'Offer already accepted' }, 409));
    const err = await make(fetchImpl as unknown as typeof fetch)
      .acceptOffer('O-0001')
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ status: 409, detail: 'Offer already accepted' });
  });

  it('raises a ContractError and warns when the body does not match', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fetchImpl = vi.fn(async () => jsonResponse({ trader_id: 101 }));
    const err = await make(fetchImpl as unknown as typeof fetch)
      .getLimit(101)
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ContractError);
    expect((err as ContractError).message).toMatch(/GET \/traders\/101\/limit/);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('reports an unreachable server as a status-0 ApiError', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    });
    const err = await make(fetchImpl as unknown as typeof fetch)
      .getTraders()
      .catch((e: unknown) => e);
    expect(err).toMatchObject({ status: 0 });
  });

  it('posts USSD as form fields and returns plain text', async () => {
    const fetchImpl = vi.fn(async () => new Response('CON Welcome'));
    const text = await make(fetchImpl as unknown as typeof fetch).ussd({
      sessionId: 's1',
      serviceCode: '*384#',
      phoneNumber: '+254700000101',
      text: '2*1',
    });
    expect(text).toBe('CON Welcome');
    const [, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.headers).toEqual({ 'Content-Type': 'application/x-www-form-urlencoded' });
    expect(new URLSearchParams(init.body as string).get('text')).toBe('2*1');
  });
});

describe('error policy', () => {
  it('maps statuses to UI actions per the contract', () => {
    expect(errorAction(new ApiError(400, ''))).toBe('inline');
    expect(errorAction(new ApiError(404, ''))).toBe('not-found');
    expect(errorAction(new ApiError(409, ''))).toBe('refetch');
    expect(errorAction(new ApiError(422, ''))).toBe('dev-warning');
    expect(errorAction(new ApiError(500, ''))).toBe('retry');
    expect(errorAction(new Error('x'))).toBe('retry');
  });

  it('shows 4xx detail to users but hides server errors', () => {
    expect(userMessage(new ApiError(400, 'Amount too high'))).toBe('Amount too high');
    expect(userMessage(new ApiError(500, 'stack trace'))).toMatch(/try again/i);
  });
});
