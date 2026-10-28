import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

export function useRepay() {
  const api = useApi();
  const qc = useQueryClient();
  const { trader } = useTrader();
  return useMutation({
    mutationFn: ({
      loanId,
      daily_sales,
      txn_id,
    }: {
      loanId: string;
      daily_sales: number;
      txn_id: string;
    }) => api.repay(loanId, { txn_id, daily_sales }),
    onSettled: () => qc.invalidateQueries({ queryKey: qk.repayments(trader.trader_id) }),
  });
}
