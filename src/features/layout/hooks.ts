import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '@/api/ApiProvider';
import { qk } from '@/api/keys';

/** Liveness indicator. Polls gently and never retries, so "offline" shows up quickly. */
export function useHealth() {
  const api = useApi();
  return useQuery({
    queryKey: qk.health,
    queryFn: () => api.health(),
    refetchInterval: 30_000,
    retry: false,
  });
}

/** Wipes demo data on the backend, then drops every cached response so screens refetch. */
export function useDemoReset() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.resetDemo(),
    onSuccess: async () => {
      await qc.invalidateQueries();
    },
  });
}
