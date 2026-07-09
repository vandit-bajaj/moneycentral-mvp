import { supabase } from '@/lib/supabaseClient';
import type { FamilyMember } from '@/types/portfolio';

export async function getFamilyMembers(): Promise<FamilyMember[]> {
  const { data, error } = await supabase
    .from('family_members')
    .select('id, name, created_at')
    .order('name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }
  return data || [];
}

export async function addFamilyMember(name: string, userId: string): Promise<FamilyMember> {
  const { data, error } = await supabase
    .from('family_members')
    .insert({ name, user_id: userId })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}
