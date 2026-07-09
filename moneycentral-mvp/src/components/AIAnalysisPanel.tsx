import React, { useState } from 'react';
import type { Holding } from '@/types/portfolio';
import { usePortfolioAnalysis } from '@/hooks/usePortfolioAnalysis';
import ReactMarkdown from 'react-markdown';
import { toast } from 'react-hot-toast';

interface AIAnalysisPanelProps {
  holdings: Holding[];
  livePrices: Record<string, number | null>;
}

export function AIAnalysisPanel({ holdings, livePrices }: AIAnalysisPanelProps) {
  const [requested, setRequested] = useState(false);

  // Map to the shape expected by /api/analyze Zod validation
  const portfolioData = holdings.map((h) => {
    const livePrice = livePrices[h.ticker_symbol];
    const hasLive = livePrice !== undefined && livePrice !== null;
    const currentPrice = hasLive ? Number(livePrice) : Number(h.avg_buy_price);
    
    return {
      ticker_symbol: h.ticker_symbol,
      quantity: Number(h.quantity),
      avg_buy_price: Number(h.avg_buy_price),
      current_price: currentPrice,
    };
  });

  const {
    data: aiInsights,
    isFetching: aiInsightsLoading,
    error: aiInsightsError,
    refetch,
  } = usePortfolioAnalysis(portfolioData, requested);

  const handleGenerateInsights = async () => {
    if (holdings.length === 0) return;

    if (!requested) {
      setRequested(true);
    } else {
      try {
        await refetch();
      } catch (err: any) {
        toast.error("Failed to refresh AI analysis.");
      }
    }
  };

  const errorMessage = aiInsightsError instanceof Error ? aiInsightsError.message : null;

  return (
    <section>
      <div className="rounded-2xl border border-zinc-850 bg-zinc-900/40 p-6 shadow-xl backdrop-blur-md transition-all duration-200 hover:border-zinc-800">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center mb-6">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <span>✨</span> AI Portfolio Insights
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              SEBI-style health check and risk profiling powered by Gemini.
            </p>
          </div>
          <button
            onClick={handleGenerateInsights}
            disabled={aiInsightsLoading || holdings.length === 0}
            className="shrink-0 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:from-indigo-500 hover:to-purple-500 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            {aiInsightsLoading ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analyzing...
              </span>
            ) : (
              "Generate AI Health Check"
            )}
          </button>
        </div>

        {/* Content Area */}
        {errorMessage && (
          <div className="rounded-xl border border-rose-950 bg-rose-950/20 px-4 py-3">
            <p className="text-sm text-rose-450">✕ {errorMessage}</p>
          </div>
        )}
        
        {aiInsights && (
          <div className="prose prose-invert max-w-none text-sm text-zinc-300 mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 leading-relaxed shadow-inner">
            <ReactMarkdown>{aiInsights}</ReactMarkdown>
          </div>
        )}
        
        {!aiInsights && !aiInsightsLoading && !errorMessage && (
          <div className="text-center py-8 text-sm text-zinc-500 italic rounded-xl border border-dashed border-zinc-800/80 bg-zinc-900/10">
            {holdings.length === 0 
              ? "Add stocks to this portfolio to unlock AI insights."
              : "Click \"Generate AI Health Check\" to analyze the currently selected portfolio."}
          </div>
        )}
      </div>
    </section>
  );
}
