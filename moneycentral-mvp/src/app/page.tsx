"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface QuoteResult {
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

interface QuoteError {
  error: string;
}

interface Holding {
  id: string;
  ticker_symbol: string;
  quantity: number;
  avg_buy_price: number;
  created_at: string;
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function Home() {
  /* ---- Live Price State ---- */
  const [symbol, setSymbol] = useState("");
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  /* ---- Add Holding State ---- */
  const [holdingSymbol, setHoldingSymbol] = useState("");
  const [holdingQty, setHoldingQty] = useState("");
  const [holdingPrice, setHoldingPrice] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  /* ---- Portfolio State ---- */
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [holdingsLoading, setHoldingsLoading] = useState(true);

  /* ================================================================ */
  /*  Live Price Fetch                                                 */
  /* ================================================================ */

  const fetchQuote = async () => {
    const trimmed = symbol.trim();
    if (!trimmed) return;

    setQuoteLoading(true);
    setQuoteError(null);
    setQuote(null);

    try {
      const res = await fetch(
        `/api/quote?symbol=${encodeURIComponent(trimmed)}`
      );
      const data: QuoteResult | QuoteError = await res.json();

      if (!res.ok || "error" in data) {
        setQuoteError((data as QuoteError).error);
      } else {
        setQuote(data as QuoteResult);
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

  const isPositive =
    quote?.change !== null && quote?.change !== undefined && quote.change >= 0;

  /* ================================================================ */
  /*  Fetch Holdings from Supabase                                     */
  /* ================================================================ */

  const fetchHoldings = useCallback(async () => {
    setHoldingsLoading(true);
    const { data, error } = await supabase
      .from("holdings")
      .select("id, ticker_symbol, quantity, avg_buy_price, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch holdings:", error.message);
    } else {
      setHoldings(data ?? []);
    }
    setHoldingsLoading(false);
  }, []);

  useEffect(() => {
    fetchHoldings();
  }, [fetchHoldings]);

  /* ================================================================ */
  /*  Add Holding to Supabase                                          */
  /* ================================================================ */

  const handleAddHolding = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError(null);
    setAddSuccess(false);

    // Format symbol: uppercase + ensure .NS suffix
    let ticker = holdingSymbol.trim().toUpperCase();
    if (!ticker.endsWith(".NS") && !ticker.endsWith(".BO")) {
      ticker = `${ticker}.NS`;
    }

    const qty = parseFloat(holdingQty);
    const price = parseFloat(holdingPrice);

    if (!ticker || isNaN(qty) || qty <= 0 || isNaN(price) || price <= 0) {
      setAddError("Please enter a valid symbol, quantity, and price.");
      setAddLoading(false);
      return;
    }

    const { error } = await supabase.from("holdings").insert({
      ticker_symbol: ticker,
      quantity: qty,
      avg_buy_price: price,
    });

    if (error) {
      setAddError(error.message);
    } else {
      setAddSuccess(true);
      setHoldingSymbol("");
      setHoldingQty("");
      setHoldingPrice("");
      // Refresh the holdings table
      fetchHoldings();
      // Auto-hide success after 3s
      setTimeout(() => setAddSuccess(false), 3000);
    }

    setAddLoading(false);
  };

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 px-4 py-16">
      <div className="mx-auto max-w-2xl">
        {/* ========== HEADER ========== */}
        <div className="mb-14 text-center">
          <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl">
            MoneyCentral
          </h1>
          <p className="mt-3 text-lg text-zinc-400">
            The Digital Family Office — Phase 1 Dashboard
          </p>
        </div>

        {/* ========== SECTION 1: LIVE PRICE CHECK ========== */}
        <section className="mb-12">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-2xl backdrop-blur-sm">
            <h2 className="mb-4 text-lg font-semibold text-white">
              📡 Live Price Check
            </h2>

            <div className="flex gap-3">
              <input
                id="symbol-input"
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                onKeyDown={handleQuoteKeyDown}
                placeholder="e.g. RELIANCE, TCS, INFY"
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
              />
              <button
                onClick={fetchQuote}
                disabled={quoteLoading || !symbol.trim()}
                className="rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {quoteLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <svg
                      className="h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Fetching
                  </span>
                ) : (
                  "Check Price"
                )}
              </button>
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              Suffix is auto-added: RELIANCE → RELIANCE.NS
            </p>

            {/* Quote Result */}
            {quote && (
              <div className="mt-5 rounded-xl border border-zinc-700/50 bg-zinc-800/50 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-white">{quote.shortName}</p>
                    <p className="text-xs text-zinc-400">{quote.symbol}</p>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/20">
                    {quote.marketState === "REGULAR"
                      ? "Market Open"
                      : quote.marketState}
                  </span>
                </div>
                <p className="mt-3 text-3xl font-bold text-white">
                  {quote.currency === "INR" ? "₹" : quote.currency}{" "}
                  {quote.price.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                {quote.change !== null && quote.changePercent !== null && (
                  <span
                    className={`mt-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold ${
                      isPositive
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {isPositive ? "▲" : "▼"}{" "}
                    {Math.abs(quote.change).toFixed(2)} (
                    {Math.abs(quote.changePercent).toFixed(2)}%)
                  </span>
                )}
              </div>
            )}

            {/* Quote Error */}
            {quoteError && (
              <div className="mt-4 rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3">
                <p className="text-sm text-red-300">✕ {quoteError}</p>
              </div>
            )}
          </div>
        </section>

        {/* ========== SECTION 2: ADD STOCK TO PORTFOLIO ========== */}
        <section className="mb-12">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-2xl backdrop-blur-sm">
            <h2 className="mb-4 text-lg font-semibold text-white">
              ➕ Add Stock to Portfolio
            </h2>

            <form onSubmit={handleAddHolding} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* Symbol */}
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
                    placeholder="INFY"
                    required
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                  />
                </div>

                {/* Quantity */}
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
                    placeholder="10"
                    min="0.01"
                    step="any"
                    required
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                  />
                </div>

                {/* Avg Buy Price */}
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
                    placeholder="1500.00"
                    min="0.01"
                    step="any"
                    required
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={addLoading}
                className="w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
              >
                {addLoading ? "Adding..." : "Add to Portfolio"}
              </button>
            </form>

            {/* Success Indicator */}
            {addSuccess && (
              <div className="mt-4 animate-[fadeIn_0.3s_ease-out] rounded-lg border border-emerald-800/50 bg-emerald-950/30 px-4 py-3">
                <p className="text-sm text-emerald-300">
                  ✓ Stock added to your portfolio successfully!
                </p>
              </div>
            )}

            {/* Error Indicator */}
            {addError && (
              <div className="mt-4 rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3">
                <p className="text-sm text-red-300">✕ {addError}</p>
              </div>
            )}
          </div>
        </section>

        {/* ========== SECTION 3: PORTFOLIO HOLDINGS TABLE ========== */}
        <section className="mb-16">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-2xl backdrop-blur-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                📊 Portfolio Holdings
              </h2>
              <button
                onClick={fetchHoldings}
                className="text-xs text-zinc-400 transition-colors hover:text-white"
              >
                ↻ Refresh
              </button>
            </div>

            {holdingsLoading ? (
              <div className="flex items-center justify-center py-12">
                <svg
                  className="h-6 w-6 animate-spin text-zinc-500"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              </div>
            ) : holdings.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-zinc-500">
                  No holdings yet. Add your first stock above!
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-700/50 text-xs uppercase tracking-wider text-zinc-400">
                      <th className="pb-3 pr-4">Ticker</th>
                      <th className="pb-3 pr-4 text-right">Qty</th>
                      <th className="pb-3 pr-4 text-right">Avg Price (₹)</th>
                      <th className="pb-3 text-right">Date Added</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdings.map((h) => (
                      <tr
                        key={h.id}
                        className="border-b border-zinc-800/50 transition-colors hover:bg-zinc-800/30"
                      >
                        <td className="py-3 pr-4 font-medium text-white">
                          {h.ticker_symbol}
                        </td>
                        <td className="py-3 pr-4 text-right text-zinc-300">
                          {h.quantity}
                        </td>
                        <td className="py-3 pr-4 text-right text-zinc-300">
                          ₹
                          {Number(h.avg_buy_price).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-3 text-right text-zinc-500">
                          {new Date(h.created_at).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* ========== FOOTER ========== */}
        <p className="text-center text-xs text-zinc-600">
          Data sourced server-side via yahoo-finance2 · Holdings stored in
          Supabase · Not for trading decisions
        </p>
      </div>
    </div>
  );
}
