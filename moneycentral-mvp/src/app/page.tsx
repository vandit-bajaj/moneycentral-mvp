"use client";

import { useState } from "react";

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

export default function Home() {
  const [symbol, setSymbol] = useState("");
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchQuote = async () => {
    const trimmed = symbol.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setQuote(null);

    try {
      const res = await fetch(`/api/quote?symbol=${encodeURIComponent(trimmed)}`);
      const data: QuoteResult | QuoteError = await res.json();

      if (!res.ok || "error" in data) {
        setError((data as QuoteError).error);
      } else {
        setQuote(data as QuoteResult);
      }
    } catch {
      setError("Network error — could not reach the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") fetchQuote();
  };

  const isPositive = quote?.change !== null && quote?.change !== undefined && quote.change >= 0;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 px-4">
      {/* Header */}
      <div className="mb-12 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl">
          MoneyCentral
        </h1>
        <p className="mt-3 text-lg text-zinc-400">
          Live Stock Price Engine — Playground
        </p>
      </div>

      {/* Search Card */}
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-2xl backdrop-blur-sm">
        <label
          htmlFor="symbol-input"
          className="mb-2 block text-sm font-medium text-zinc-400"
        >
          Enter NSE / BSE Ticker Symbol
        </label>

        <div className="flex gap-3">
          <input
            id="symbol-input"
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
            placeholder="e.g. RELIANCE, TCS, INFY"
            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
          />
          <button
            onClick={fetchQuote}
            disabled={loading || !symbol.trim()}
            className="rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? (
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
              "Check Live Price"
            )}
          </button>
        </div>

        <p className="mt-2 text-xs text-zinc-500">
          Suffix is auto-added: RELIANCE → RELIANCE.NS
        </p>
      </div>

      {/* Result Card */}
      {quote && (
        <div className="mt-8 w-full max-w-md animate-[fadeIn_0.3s_ease-out] rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-2xl backdrop-blur-sm">
          {/* Stock Name + Symbol */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">{quote.shortName}</h2>
              <p className="text-sm text-zinc-400">{quote.symbol}</p>
            </div>
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/20">
              {quote.marketState === "REGULAR" ? "Market Open" : quote.marketState}
            </span>
          </div>

          {/* Price */}
          <div className="mt-6">
            <p className="text-4xl font-bold tracking-tight text-white">
              {quote.currency === "INR" ? "₹" : quote.currency}{" "}
              {quote.price.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>

            {/* Change Badge */}
            {quote.change !== null && quote.changePercent !== null && (
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-semibold ${
                    isPositive
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-red-500/10 text-red-400"
                  }`}
                >
                  <span>{isPositive ? "▲" : "▼"}</span>
                  {Math.abs(quote.change).toFixed(2)} (
                  {Math.abs(quote.changePercent).toFixed(2)}%)
                </span>
                {quote.previousClose && (
                  <span className="text-xs text-zinc-500">
                    Prev Close: ₹{quote.previousClose.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Timestamp */}
          <p className="mt-4 text-xs text-zinc-600">
            Fetched at {new Date(quote.timestamp).toLocaleTimeString("en-IN")}
          </p>
        </div>
      )}

      {/* Error Card */}
      {error && (
        <div className="mt-8 w-full max-w-md rounded-2xl border border-red-900/50 bg-red-950/30 p-5 shadow-xl">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-red-400">✕</span>
            <p className="text-sm text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <p className="mt-16 text-xs text-zinc-600">
        Data sourced server-side via yahoo-finance2 · Not for trading decisions
      </p>
    </div>
  );
}
