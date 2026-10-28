import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/api/ApiProvider';
import { qk } from '@/api/keys';
import { useTrader } from '@/features/traders/TraderContext';

export function useForecast() {
  const api = useApi();
  const { trader } = useTrader();
  return useQuery({
    queryKey: qk.forecast(trader.trader_id),
    queryFn: () => api.getForecast(trader.trader_id),
  });
}

export function useInsights() {
  const api = useApi();
  const { trader } = useTrader();
  return useQuery({
    queryKey: qk.insights(trader.trader_id),
    queryFn: () => api.getInsights(trader.trader_id),
  });
}
