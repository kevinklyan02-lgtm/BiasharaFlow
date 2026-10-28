import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/api/ApiProvider';
import { qk } from '@/api/keys';
import { useTrader } from '@/features/traders/TraderContext';

export function useRepayments() {
  const api = useApi();
  const { trader } = useTrader();
  return useQuery({
    queryKey: qk.repayments(trader.trader_id),
    queryFn: () => api.getRepayments(trader.trader_id),
  });
}
