import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/api/ApiProvider';
import { qk } from '@/api/keys';
import { useTrader } from '@/features/traders/TraderContext';

export function useStockCheckin() {
  const api = useApi();
  const qc = useQueryClient();
  const { trader } = useTrader();
  return useMutation({
    mutationFn: (item: string) => api.stockCheckin(trader.trader_id, item),
    // Check-ins feed the "running low most often" insight.
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.insights(trader.trader_id) }),
  });
}
