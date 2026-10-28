import { useQuery } from '@tanstack/react-query';
import { useApi } from '@/api/ApiProvider';
import { qk } from '@/api/keys';

export function useBacktest() {
  const api = useApi();
  return useQuery({ queryKey: qk.backtest, queryFn: () => api.getBacktest() });
}
