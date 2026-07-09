import { useQuery } from '@tanstack/react-query';

export interface AnalyzableHolding {
  ticker_symbol: string;
  quantity: number;
  avg_buy_price: number;
  current_price: number;
}

async function analyzePortfolio(holdings: AnalyzableHolding[]): Promise<string> {
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ holdings }),
  });
  if (!res.ok) {
    throw new Error('Analysis failed');
  }
  const data = await res.json();
  return data.summary;
}

export function usePortfolioAnalysis(
  holdings: AnalyzableHolding[],
  enabled: boolean
) {
  return useQuery({
    queryKey: ['analysis', holdings.map((h) => `${h.ticker_symbol}:${h.quantity}:${h.current_price}`).join(',')],
    queryFn: () => analyzePortfolio(holdings),
    enabled: enabled && holdings.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
