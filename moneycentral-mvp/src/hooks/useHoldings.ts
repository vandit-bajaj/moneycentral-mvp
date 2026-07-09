import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getHoldings, addHolding, deleteHolding } from '@/services/holdings.service';
import type { Holding } from '@/types/portfolio';

export const holdingsKeys = {
  all: ['holdings'] as const,
};

export function useHoldings() {
  return useQuery({
    queryKey: holdingsKeys.all,
    queryFn: getHoldings,
  });
}

export function useAddHolding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<Holding, 'id' | 'created_at'> & { user_id: string }) =>
      addHolding(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: holdingsKeys.all });
    },
  });
}

export function useDeleteHolding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteHolding(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: holdingsKeys.all });
    },
  });
}
