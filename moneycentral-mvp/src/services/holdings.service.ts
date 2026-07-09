import { supabase } from '@/lib/supabaseClient';
import type { Holding } from '@/types/portfolio';

export async function getHoldings(): Promise<Holding[]> {
  const { data, error } = await supabase
    .from('holdings')
    .select('id, ticker_symbol, quantity, avg_buy_price, member_id, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  return data || [];
}

export async function addHolding(
  input: Omit<Holding, 'id' | 'created_at'> & { user_id: string }
): Promise<Holding> {
  const { data, error } = await supabase
    .from('holdings')
    .insert({
      ticker_symbol: input.ticker_symbol,
      quantity: input.quantity,
      avg_buy_price: input.avg_buy_price,
      member_id: input.member_id,
      user_id: input.user_id,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

export async function deleteHolding(id: string): Promise<void> {
  const { error } = await supabase
    .from('holdings')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
}
