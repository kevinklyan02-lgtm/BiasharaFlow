import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/api/ApiProvider';
import { qk } from '@/api/keys';
import { useTrader } from '@/features/traders/TraderContext';

export function useDisputes() {
  const api = useApi();
  const { trader } = useTrader();
  return useQuery({
    queryKey: qk.disputes(trader.trader_id),
    queryFn: () => api.getDisputes(trader.trader_id),
  });
}
