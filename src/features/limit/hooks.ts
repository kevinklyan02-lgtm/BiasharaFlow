import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/api/ApiProvider';
import { qk } from '@/api/keys';
import { useTrader } from '@/features/traders/TraderContext';

export function useLimit() {
  const api = useApi();
  const { trader } = useTrader();
  return useQuery({
    queryKey: qk.limit(trader.trader_id),
    queryFn: () => api.getLimit(trader.trader_id),
  });
}
