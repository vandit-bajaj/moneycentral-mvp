import React, { useState } from 'react';
import type { Holding, FamilyMember, QuoteResult, QuoteError } from '@/types/portfolio';
import { useAddHolding, useDeleteHolding } from '@/hooks/useHoldings';
import { formatINR, calculatePnL } from '@/utils/portfolio';
import { toast } from 'react-hot-toast';

interface HoldingsTableProps {
  holdings: Holding[];
  displayedHoldings: Holding[];
  isLoading: boolean;
  familyMembers: FamilyMember[];
  livePrices: Record<string, number | null>;
  livePricesLoading: boolean;
  onRefreshPrices: () => void;
  userId: string;
}

export function HoldingsTable({
  holdings,
  displayedHoldings,
  isLoading,
  familyMembers,
  livePrices,
  livePricesLoading,
  onRefreshPrices,
  userId,
}: HoldingsTableProps) {
  // --- Live Quote State ---
  const [symbol, setSymbol] = useState("");
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  // --- Add Holding State ---
  const [holdingSymbol, setHoldingSymbol] = useState("");
  const [holdingQty, setHoldingQty] = useState("");
  const [holdingPrice, setHoldingPrice] = useState("");
  const [holdingMemberId, setHoldingMemberId] = useState("");

  const addHoldingMutation = useAddHolding();
  const deleteHoldingMutation = useDeleteHolding();

  // --- Handlers ---
  const fetchQuote = async () => {
    const trimmed = symbol.trim();
    if (!trimmed) return;

    setQuoteLoading(true);
    setQuoteError(null);
    setQuote(null);

    try {
      const res = await fetch(`/api/quote?symbol=${encodeURIComponent(trimmed)}`);
      const data = await res.json();

      if (!res.ok || data.error) {
        setQuoteError(data.error || "Failed to fetch quote");
      } else {
        setQuote(data);
      }
    } catch {
      setQuoteError("Network error — could not reach the server.");
    } finally {
      setQuoteLoading(false);
    }
  };

  const handleQuoteKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") fetchQuote();
  };

  const handleAddHolding = async (e: React.FormEvent) => {
    e.preventDefault();

    let ticker = holdingSymbol.trim().toUpperCase();
    if (!ticker.endsWith(".NS") && !ticker.endsWith(".BO")) {
      ticker = `${ticker}.NS`;
    }

    const qty = parseFloat(holdingQty);
    const price = parseFloat(holdingPrice);

    if (!ticker || isNaN(qty) || qty <= 0 || isNaN(price) || price <= 0 || !holdingMemberId) {
      toast.error("Please fill out all fields correctly.");
      return;
    }

    try {
      await addHoldingMutation.mutateAsync({
        ticker_symbol: ticker,
        quantity: qty,
        avg_buy_price: price,
        member_id: holdingMemberId,
        user_id: userId,
      });

      setHoldingSymbol("");
      setHoldingQty("");
      setHoldingPrice("");
      setHoldingMemberId("");
      toast.success("Stock added to portfolio successfully!");
      onRefreshPrices();
    } catch (err: any) {
      toast.error(err.message || "Failed to add holding");
    }
  };

  const handleDeleteHolding = async (id: string, ticker: string) => {
    if (!confirm(`Are you sure you want to remove ${ticker} from your portfolio?`)) {
      return;
    }

    try {
      await deleteHoldingMutation.mutateAsync(id);
      toast.success("Holding removed successfully.");
      onRefreshPrices();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete holding");
    }
  };

  const isPositive = quote?.change !== null && quote?.change !== undefined && quote.change >= 0;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      {/* Left Column: Input Panel */}
      <div className="space-y-8 lg:col-span-1">
        {/* ========== SECTION 1: LIVE PRICE CHECK ========== */}
        <section>
          <div className="rounded-2xl border border-zinc-850 bg-zinc-900/40 p-6 shadow-xl backdrop-blur-md transition-all duration-200 hover:border-zinc-800">
            <h2 className="mb-4 text-base font-semibold text-white flex items-center gap-2">
              <span>📡</span> Live Price Check
            </h2>

            <div className="flex flex-col gap-3">
              <input
                id="symbol-input"
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                onKeyDown={handleQuoteKeyDown}
                placeholder="Enter Stock Symbol (e.g. TCS)"
                className="w-full rounded-xl border border-zinc-750 bg-zinc-900/60 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-all duration-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20"
              />
              <button
                onClick={fetchQuote}
                disabled={quoteLoading || !symbol.trim()}
                className="w-full rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-emerald-500 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
              >
                {quoteLoading ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Fetching...
                  </span>
                ) : (
                  "Check Live Price"
                )}
              </button>
            </div>
            <p className="mt-2.5 text-[10px] text-zinc-500 leading-normal">
              Suffix is automatically applied: RELIANCE → RELIANCE.NS
            </p>

            {/* Quote Result */}
            {quote && (
              <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 transition-all duration-200">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-white leading-tight">{quote.shortName}</p>
                    <p className="text-[10px] text-zinc-500 mt-1 font-mono">{quote.symbol}</p>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold text-emerald-400 leading-none border border-emerald-500/20">
                    {quote.marketState === "REGULAR" ? "Market Open" : quote.marketState}
                  </span>
                </div>
                <p className="mt-4 text-2xl font-black text-white tracking-tight">
                  {quote.currency === "INR" ? "" : quote.currency} {formatINR(quote.price)}
                </p>
                {quote.change !== null && quote.changePercent !== null && (
                  <span
                    className={`mt-2.5 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold ${
                      isPositive
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-rose-500/10 text-rose-400"
                    }`}
                  >
                    {isPositive ? "▲" : "▼"} {Math.abs(quote.change).toFixed(2)} ({Math.abs(quote.changePercent).toFixed(2)}%)
                  </span>
                )}
              </div>
            )}

            {/* Quote Error */}
            {quoteError && (
              <div className="mt-4 rounded-xl border border-rose-950 bg-rose-950/20 px-4 py-3">
                <p className="text-xs text-rose-400">✕ {quoteError}</p>
              </div>
            )}
          </div>
        </section>

        {/* ========== SECTION 2: ADD STOCK TO PORTFOLIO ========== */}
        <section>
          <div className="rounded-2xl border border-zinc-850 bg-zinc-900/40 p-6 shadow-xl backdrop-blur-md transition-all duration-200 hover:border-zinc-800">
            <h2 className="mb-4 text-base font-semibold text-white flex items-center gap-2">
              <span>➕</span> Add Stock
            </h2>

            <form onSubmit={handleAddHolding} className="space-y-4">
              <div>
                <label
                  htmlFor="holding-member"
                  className="mb-1 block text-xs font-medium text-zinc-400"
                >
                  Family Member Owner
                </label>
                {familyMembers.length === 0 ? (
                  <p className="text-xs text-amber-500 leading-relaxed bg-amber-500/5 border border-amber-500/20 p-2.5 rounded-lg">
                    ⚠️ Please add at least one family member above to log a holding.
                  </p>
                ) : (
                  <select
                    id="holding-member"
                    value={holdingMemberId}
                    onChange={(e) => setHoldingMemberId(e.target.value)}
                    required
                    className="w-full rounded-xl border border-zinc-750 bg-zinc-900/60 px-4 py-3 text-sm text-white outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                  >
                    <option value="" disabled>Select owner...</option>
                    {familyMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label
                  htmlFor="holding-symbol"
                  className="mb-1 block text-xs font-medium text-zinc-400"
                >
                  Stock Symbol
                </label>
                <input
                  id="holding-symbol"
                  type="text"
                  value={holdingSymbol}
                  onChange={(e) =>
                    setHoldingSymbol(e.target.value.toUpperCase())
                  }
                  placeholder="e.g. INFY"
                  required
                  className="w-full rounded-xl border border-zinc-750 bg-zinc-900/60 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label
                  htmlFor="holding-qty"
                  className="mb-1 block text-xs font-medium text-zinc-400"
                >
                  Quantity
                </label>
                <input
                  id="holding-qty"
                  type="number"
                  value={holdingQty}
                  onChange={(e) => setHoldingQty(e.target.value)}
                  placeholder="e.g. 10"
                  min="0.01"
                  step="any"
                  required
                  className="w-full rounded-xl border border-zinc-750 bg-zinc-900/60 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label
                  htmlFor="holding-price"
                  className="mb-1 block text-xs font-medium text-zinc-400"
                >
                  Avg Buy Price (₹)
                </label>
                <input
                  id="holding-price"
                  type="number"
                  value={holdingPrice}
                  onChange={(e) => setHoldingPrice(e.target.value)}
                  placeholder="e.g. 1450.50"
                  min="0.01"
                  step="any"
                  required
                  className="w-full rounded-xl border border-zinc-750 bg-zinc-900/60 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                />
              </div>

              <button
                type="submit"
                disabled={addHoldingMutation.isPending || familyMembers.length === 0}
                className="w-full rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-indigo-500 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
              >
                {addHoldingMutation.isPending ? "Adding..." : "Add to Portfolio"}
              </button>
            </form>
          </div>
        </section>
      </div>

      {/* Right Column: Holdings Table Panel */}
      <div className="lg:col-span-2">
        {/* ========== SECTION 3: PORTFOLIO HOLDINGS TABLE ========== */}
        <section className="h-full">
          <div className="h-full rounded-2xl border border-zinc-850 bg-zinc-900/40 p-6 shadow-xl backdrop-blur-md flex flex-col transition-all duration-200 hover:border-zinc-800">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <span>📊</span> Portfolio Holdings
              </h2>
              <button
                onClick={onRefreshPrices}
                disabled={isLoading || livePricesLoading}
                className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors duration-200 disabled:opacity-50"
              >
                {isLoading || livePricesLoading ? "Refreshing..." : "↻ Refresh"}
              </button>
            </div>

            {isLoading ? (
              <div className="flex-1 flex items-center justify-center py-24">
                <svg className="h-6 w-6 animate-spin text-zinc-500" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            ) : displayedHoldings.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-24 text-center space-y-3 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/10 px-4">
                <div className="text-3xl">💼</div>
                <h3 className="text-sm font-semibold text-zinc-400">Your portfolio is empty</h3>
                <p className="text-xs text-zinc-500 max-w-sm">
                  {holdings.length === 0
                    ? "Log your first stock buy to start tracking live prices, gains, and AI risk reports."
                    : "No holdings found matching the selected family member filter."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-850 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      <th className="pb-3 pr-4">Ticker</th>
                      <th className="pb-3 pr-4">Owner</th>
                      <th className="pb-3 pr-4 text-right">Qty</th>
                      <th className="pb-3 pr-4 text-right">Avg Price</th>
                      <th className="pb-3 pr-4 text-right">Live Price</th>
                      <th className="pb-3 pr-4 text-right">P&L</th>
                      <th className="pb-3 text-right">Added</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850/50">
                    {displayedHoldings.map((h) => {
                      const qty = Number(h.quantity);
                      const buyPrice = Number(h.avg_buy_price);
                      const livePrice = livePrices[h.ticker_symbol];
                      const hasLive = livePrice !== undefined && livePrice !== null;
                      const effectiveLive = hasLive ? Number(livePrice) : buyPrice;
                      const { absolute: indPL, percent: indPLPercent } = calculatePnL(
                        qty,
                        buyPrice,
                        effectiveLive
                      );
                      
                      const owner = familyMembers.find(m => m.id === h.member_id)?.name || "—";

                      return (
                        <tr
                          key={h.id}
                          className="transition-colors duration-150 hover:bg-zinc-800/20"
                        >
                          <td className="py-4 pr-4 font-semibold text-white">
                            {h.ticker_symbol}
                          </td>
                          <td className="py-4 pr-4 text-xs text-zinc-400">
                            {owner}
                          </td>
                          <td className="py-4 pr-4 text-right font-mono text-xs text-zinc-300">
                            {h.quantity}
                          </td>
                          <td className="py-4 pr-4 text-right font-mono text-xs text-zinc-300">
                            {formatINR(buyPrice)}
                          </td>
                          <td className="py-4 pr-4 text-right font-mono text-xs text-zinc-300">
                            {hasLive ? (
                              formatINR(Number(livePrice))
                            ) : (
                              <span className="text-zinc-600">—</span>
                            )}
                          </td>
                          <td
                            className={`py-4 pr-4 text-right font-mono text-xs font-semibold ${
                              indPL >= 0 ? "text-emerald-400" : "text-rose-500"
                            }`}
                          >
                            {hasLive ? (
                              <div>
                                <div className="font-bold">
                                  {indPL >= 0 ? "+" : ""}
                                  {formatINR(indPL)}
                                </div>
                                <div className="text-[9px] opacity-80 mt-0.5">
                                  {indPL >= 0 ? "▲" : "▼"} {indPLPercent.toFixed(2)}%
                                </div>
                              </div>
                            ) : (
                              <span className="text-zinc-600 font-normal">—</span>
                            )}
                          </td>
                          <td className="py-4 text-right text-[11px] text-zinc-550 font-mono">
                            {new Date(h.created_at).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}
                          </td>
                          <td className="py-4 text-right">
                            <button
                              onClick={() => handleDeleteHolding(h.id, h.ticker_symbol)}
                              disabled={deleteHoldingMutation.isPending}
                              className="text-xs font-semibold text-rose-500 hover:text-rose-450 hover:underline transition-all active:scale-95 disabled:opacity-40"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
