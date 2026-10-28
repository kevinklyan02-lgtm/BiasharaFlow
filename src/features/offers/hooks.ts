import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/api/ApiProvider';
import { qk } from '@/api/keys';
import { useTrader } from '@/features/traders/TraderContext';

export function useOffers() {
  const api = useApi();
  const { trader } = useTrader();
  return useQuery({
    queryKey: qk.offers(trader.trader_id),
    queryFn: () => api.getOffers(trader.trader_id),
  });
}

/** Everything that depends on offers/loans is refetched after any offer action, even on 409. */
function useRefreshAfterOfferAction() {
  const qc = useQueryClient();
  const { trader } = useTrader();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: qk.offers(trader.trader_id) }),
      qc.invalidateQueries({ queryKey: qk.repayments(trader.trader_id) }),
      qc.invalidateQueries({ queryKey: qk.limit(trader.trader_id) }),
    ]);
}

export function useCreateOffer() {
  const api = useApi();
  const { trader } = useTrader();
  const refresh = useRefreshAfterOfferAction();
  return useMutation({
    mutationFn: (amount: number) => api.createOffer(trader.trader_id, amount),
    onSettled: refresh,
  });
}

export function useAcceptOffer() {
  const api = useApi();
  const refresh = useRefreshAfterOfferAction();
  return useMutation({
    mutationFn: (offerId: string) => api.acceptOffer(offerId),
    onSettled: refresh,
  });
}

export function useDeclineOffer() {
  const api = useApi();
  const refresh = useRefreshAfterOfferAction();
  return useMutation({
    mutationFn: (offerId: string) => api.declineOffer(offerId),
    onSettled: refresh,
  });
}
