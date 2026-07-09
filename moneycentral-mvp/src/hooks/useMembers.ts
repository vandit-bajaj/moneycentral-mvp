import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFamilyMembers, addFamilyMember } from '@/services/members.service';

export const membersKeys = {
  all: ['family_members'] as const,
};

export function useMembers() {
  return useQuery({
    queryKey: membersKeys.all,
    queryFn: getFamilyMembers,
  });
}

export function useAddMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, userId }: { name: string; userId: string }) =>
      addFamilyMember(name, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: membersKeys.all });
    },
  });
}
