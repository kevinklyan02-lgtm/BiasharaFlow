import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

export function useCreateDispute() {
  const api = useApi();
  const qc = useQueryClient();
  const { trader } = useTrader();
  return useMutation({
    mutationFn: (body: { reason: string; loan_id?: string }) =>
      api.createDispute(trader.trader_id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.disputes(trader.trader_id) }),
  });
}
