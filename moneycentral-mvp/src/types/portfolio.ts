export interface QuoteResult {
  symbol: string;
  shortName: string;
  price: number;
  previousClose: number | null;
  change: number | null;
  changePercent: number | null;
  currency: string;
  marketState: string;
  timestamp: string;
}

export interface QuoteError {
  error: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  created_at: string;
}

export interface Holding {
  id: string;
  ticker_symbol: string;
  quantity: number;
  avg_buy_price: number;
  member_id: string | null;
  created_at: string;
}
