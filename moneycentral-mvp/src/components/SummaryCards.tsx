import React from 'react';
import type { Holding } from '@/types/portfolio';
import { formatINR, calculatePnL, getTotalInvested } from '@/utils/portfolio';

interface SummaryCardsProps {
  holdings: Holding[];
  livePrices: Record<string, number | null>;
  livePricesLoading: boolean;
}

export function SummaryCards({ holdings, livePrices, livePricesLoading }: SummaryCardsProps) {
  const totalInvested = getTotalInvested(holdings);

  let currentValue = 0;
  holdings.forEach((h) => {
    const qty = Number(h.quantity);
    const buyPrice = Number(h.avg_buy_price);
    const livePrice =
      livePrices[h.ticker_symbol] !== undefined &&
      livePrices[h.ticker_symbol] !== null
        ? Number(livePrices[h.ticker_symbol])
        : buyPrice;

    currentValue += qty * livePrice;
  });

  const { absolute: totalPL, percent: totalPLPercent } = calculatePnL(
    1,
    totalInvested,
    currentValue
  );

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {/* Total Invested */}
      <div className="rounded-2xl border border-zinc-850 bg-zinc-900/30 p-6 backdrop-blur-sm shadow-md transition-all duration-200 hover:border-zinc-800 hover:-translate-y-0.5">
        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
          Total Invested
        </p>
        <p className="mt-3 text-3xl font-extrabold text-white tracking-tight">
          {formatINR(totalInvested)}
        </p>
      </div>

      {/* Current Value */}
      <div className="rounded-2xl border border-zinc-850 bg-zinc-900/30 p-6 backdrop-blur-sm shadow-md transition-all duration-200 hover:border-zinc-800 hover:-translate-y-0.5">
        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
          Current Value
        </p>
        <p className="mt-3 text-3xl font-extrabold text-white tracking-tight">
          {livePricesLoading ? (
            <span className="inline-block h-8 w-32 animate-pulse rounded-lg bg-zinc-850" />
          ) : (
            formatINR(currentValue)
          )}
        </p>
      </div>

      {/* Total P&L */}
      <div className="rounded-2xl border border-zinc-850 bg-zinc-900/30 p-6 backdrop-blur-sm shadow-md transition-all duration-200 hover:border-zinc-800 hover:-translate-y-0.5">
        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
          Total Return (P&L)
        </p>
        <div className="mt-3 flex items-baseline gap-2.5">
          {livePricesLoading ? (
            <span className="inline-block h-8 w-36 animate-pulse rounded-lg bg-zinc-850" />
          ) : (
            <>
              <p
                className={`text-3xl font-extrabold tracking-tight ${
                  totalPL >= 0 ? "text-emerald-400" : "text-rose-500"
                }`}
              >
                {formatINR(totalPL)}
              </p>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                  totalPL >= 0 
                    ? "bg-emerald-500/10 text-emerald-400" 
                    : "bg-rose-500/10 text-rose-400"
                }`}
              >
                {totalPL >= 0 ? "▲" : "▼"} {totalPLPercent.toFixed(2)}%
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
