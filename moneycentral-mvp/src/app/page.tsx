"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import ReactMarkdown from "react-markdown";

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

interface FamilyMember {
  id: string;
  name: string;
  created_at: string;
}

interface Holding {
  id: string;
  ticker_symbol: string;
  quantity: number;
  avg_buy_price: number;
  member_id: string | null;
  created_at: string;
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function Home() {
  /* ---- Live Price Checker State ---- */
  const [symbol, setSymbol] = useState("");
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  /* ---- Family Member State ---- */
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [newMemberName, setNewMemberName] = useState("");
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  const [selectedFamilyMemberId, setSelectedFamilyMemberId] = useState<string>("ALL");

  /* ---- Add Holding State ---- */
  const [holdingSymbol, setHoldingSymbol] = useState("");
  const [holdingQty, setHoldingQty] = useState("");
  const [holdingPrice, setHoldingPrice] = useState("");
  const [holdingMemberId, setHoldingMemberId] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  /* ---- Portfolio State ---- */
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [holdingsLoading, setHoldingsLoading] = useState(true);
  const [livePrices, setLivePrices] = useState<Record<string, number | null>>({});
  const [livePricesLoading, setLivePricesLoading] = useState(false);

  /* ---- AI Insights State ---- */
  const [aiInsightsLoading, setAiInsightsLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [aiInsightsError, setAiInsightsError] = useState<string | null>(null);

  /* ================================================================ */
  /*  Fetch Family Members                                             */
  /* ================================================================ */

  const fetchFamilyMembers = useCallback(async () => {
    const { data, error } = await supabase
      .from("family_members")
      .select("id, name, created_at")
      .order("name", { ascending: true });

    if (error) {
      console.error("Failed to fetch family members:", error.message);
    } else {
      setFamilyMembers(data || []);
    }
  }, []);

  useEffect(() => {
    fetchFamilyMembers();
  }, [fetchFamilyMembers]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    setAddMemberLoading(true);
    const { error } = await supabase.from("family_members").insert({
      name: newMemberName.trim(),
    });

    if (error) {
      alert("Error adding family member: " + error.message);
    } else {
      setNewMemberName("");
      fetchFamilyMembers();
    }
    setAddMemberLoading(false);
  };

  /* ================================================================ */
  /*  Live Price Fetch (Single Check)                                  */
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
  /*  Fetch Batch Live Prices & Holdings                              */
  /* ================================================================ */

  const fetchLivePrices = useCallback(async (symbols: string[]) => {
    if (symbols.length === 0) return;
    setLivePricesLoading(true);
    try {
      const res = await fetch(
        `/api/quote?symbols=${encodeURIComponent(symbols.join(","))}`
      );
      if (res.ok) {
        const data = await res.json();
        setLivePrices(data);
      }
    } catch (err) {
      console.error("Failed to fetch live prices:", err);
    } finally {
      setLivePricesLoading(false);
    }
  }, []);

  const fetchHoldings = useCallback(async () => {
    setHoldingsLoading(true);
    const { data, error } = await supabase
      .from("holdings")
      .select("id, ticker_symbol, quantity, avg_buy_price, member_id, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch holdings:", error.message);
    } else {
      const fetchedHoldings = data ?? [];
      setHoldings(fetchedHoldings);
      if (fetchedHoldings.length > 0) {
        const symbols = Array.from(
          new Set(fetchedHoldings.map((h) => h.ticker_symbol))
        );
        await fetchLivePrices(symbols);
      }
    }
    setHoldingsLoading(false);
  }, [fetchLivePrices]);

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

    if (!ticker || isNaN(qty) || qty <= 0 || isNaN(price) || price <= 0 || !holdingMemberId) {
      setAddError("Please fill out all fields correctly.");
      setAddLoading(false);
      return;
    }

    const { error } = await supabase.from("holdings").insert({
      ticker_symbol: ticker,
      quantity: qty,
      avg_buy_price: price,
      member_id: holdingMemberId,
    });

    if (error) {
      setAddError(error.message);
    } else {
      setAddSuccess(true);
      setHoldingSymbol("");
      setHoldingQty("");
      setHoldingPrice("");
      setHoldingMemberId("");
      // Refresh holdings
      fetchHoldings();
      // Auto-hide success after 3s
      setTimeout(() => setAddSuccess(false), 3000);
    }

    setAddLoading(false);
  };

  /* ================================================================ */
  /*  Portfolio Calculations & Filtering                               */
  /* ================================================================ */

  const displayedHoldings = holdings.filter((h) =>
    selectedFamilyMemberId === "ALL" ? true : h.member_id === selectedFamilyMemberId
  );

  let totalInvested = 0;
  let currentValue = 0;

  displayedHoldings.forEach((h) => {
    const qty = Number(h.quantity);
    const buyPrice = Number(h.avg_buy_price);
    const livePrice =
      livePrices[h.ticker_symbol] !== undefined &&
      livePrices[h.ticker_symbol] !== null
        ? Number(livePrices[h.ticker_symbol])
        : buyPrice;

    totalInvested += qty * buyPrice;
    currentValue += qty * livePrice;
  });

  const totalPL = currentValue - totalInvested;
  const totalPLPercent = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0;

  /* ================================================================ */
  /*  AI Portfolio Insights                                            */
  /* ================================================================ */

  const handleGenerateInsights = async () => {
    if (displayedHoldings.length === 0) return;

    setAiInsightsLoading(true);
    setAiInsights(null);
    setAiInsightsError(null);

    // Prepare portfolio data exactly as requested based on displayed holdings
    const portfolioData = displayedHoldings.map((h) => {
      const livePrice = livePrices[h.ticker_symbol];
      const hasLive = livePrice !== undefined && livePrice !== null;
      const currentVal = hasLive ? h.quantity * livePrice : h.quantity * h.avg_buy_price;
      const costVal = h.quantity * h.avg_buy_price;
      
      return {
        Ticker: h.ticker_symbol,
        Quantity: h.quantity,
        BuyPrice: h.avg_buy_price,
        CurrentPrice: hasLive ? livePrice : h.avg_buy_price,
        PnL: currentVal - costVal,
      };
    });

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ portfolio: portfolioData }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setAiInsightsError(data.error || "Failed to generate insights.");
      } else {
        setAiInsights(data.summary);
      }
    } catch (err) {
      console.error("Failed to generate AI insights:", err);
      setAiInsightsError("Network error while generating AI insights.");
    } finally {
      setAiInsightsLoading(false);
    }
  };

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 px-4 py-16">
      <div className="mx-auto max-w-5xl">
        {/* ========== HEADER ========== */}
        <div className="mb-14 text-center">
          <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl">
            MoneyCentral
          </h1>
          <p className="mt-3 text-lg text-zinc-400">
            The Digital Family Office — Phase 3 Dashboard
          </p>
        </div>

        {/* ========== SECTION: FAMILY OFFICE CONTROLS ========== */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Family Members Office */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-sm shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-white">
              👨‍👩‍👧‍👦 Family Members Office
            </h2>
            <form onSubmit={handleAddMember} className="flex gap-3">
              <input
                type="text"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder="New Member Name"
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                required
              />
              <button
                type="submit"
                disabled={addMemberLoading}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {addMemberLoading ? "Adding..." : "Add Member"}
              </button>
            </form>
          </div>

          {/* Filter Dropdown */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 backdrop-blur-sm shadow-xl flex flex-col justify-center">
            <label className="mb-2 block text-sm font-semibold text-zinc-300">
              Filter Dashboard by Member
            </label>
            <select
              value={selectedFamilyMemberId}
              onChange={(e) => setSelectedFamilyMemberId(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
            >
              <option value="ALL">All Family (Combined Portfolio)</option>
              {familyMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}'s Portfolio
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ========== SECTION 0: SUMMARY CARDS ========== */}
        <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Total Invested */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 backdrop-blur-sm shadow-lg transition-all">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Total Invested
            </p>
            <p className="mt-2 text-2xl font-bold text-white">
              ₹
              {totalInvested.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

          {/* Current Value */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 backdrop-blur-sm shadow-lg transition-all">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Current Value
            </p>
            <p className="mt-2 text-2xl font-bold text-white">
              {livePricesLoading ? (
                <span className="inline-block h-6 w-24 animate-pulse rounded bg-zinc-800" />
              ) : (
                `₹${currentValue.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
              )}
            </p>
          </div>

          {/* Total P&L */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 backdrop-blur-sm shadow-lg transition-all">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Total Return (P&L)
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              {livePricesLoading ? (
                <span className="inline-block h-6 w-28 animate-pulse rounded bg-zinc-800" />
              ) : (
                <>
                  <p
                    className={`text-2xl font-bold ${
                      totalPL >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {totalPL >= 0 ? "+" : ""}
                    ₹
                    {totalPL.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <span
                    className={`text-xs font-semibold ${
                      totalPL >= 0 ? "text-emerald-500" : "text-red-500"
                    }`}
                  >
                    ({totalPL >= 0 ? "+" : ""}
                    {totalPLPercent.toFixed(2)}%)
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ========== SECTION 0.5: AI PORTFOLIO INSIGHTS ========== */}
        <section className="mb-12">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-2xl backdrop-blur-sm">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  ✨ AI Portfolio Insights
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  SEBI-style health check and risk profiling powered by Gemini.
                </p>
              </div>
              <button
                onClick={handleGenerateInsights}
                disabled={aiInsightsLoading || displayedHoldings.length === 0}
                className="shrink-0 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:from-indigo-500 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
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
            {aiInsightsError && (
              <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3">
                <p className="text-sm text-red-300">✕ {aiInsightsError}</p>
              </div>
            )}
            
            {aiInsights && (
              <div className="prose prose-invert prose-emerald max-w-none text-sm text-zinc-300 mt-4 rounded-xl border border-zinc-700/50 bg-zinc-800/30 p-5">
                <ReactMarkdown>{aiInsights}</ReactMarkdown>
              </div>
            )}
            
            {!aiInsights && !aiInsightsLoading && !aiInsightsError && (
              <div className="text-center py-6 text-sm text-zinc-500 italic">
                {displayedHoldings.length === 0 
                  ? "Add stocks to this portfolio to unlock AI insights."
                  : "Click \"Generate AI Health Check\" to analyze the currently selected portfolio."}
              </div>
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Column: Input Panel */}
          <div className="space-y-8 lg:col-span-1">
            {/* ========== SECTION 1: LIVE PRICE CHECK ========== */}
            <section>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-2xl backdrop-blur-sm">
                <h2 className="mb-4 text-lg font-semibold text-white">
                  📡 Live Price Check
                </h2>

                <div className="flex flex-col gap-3">
                  <input
                    id="symbol-input"
                    type="text"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    onKeyDown={handleQuoteKeyDown}
                    placeholder="e.g. RELIANCE, TCS, INFY"
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                  />
                  <button
                    onClick={fetchQuote}
                    disabled={quoteLoading || !symbol.trim()}
                    className="w-full rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {quoteLoading ? (
                      <span className="inline-flex items-center justify-center gap-2">
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
                    <p className="mt-3 text-2xl font-bold text-white">
                      {quote.currency === "INR" ? "₹" : quote.currency}{" "}
                      {quote.price.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    {quote.change !== null && quote.changePercent !== null && (
                      <span
                        className={`mt-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${
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
            <section>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-2xl backdrop-blur-sm">
                <h2 className="mb-4 text-lg font-semibold text-white">
                  ➕ Add Stock to Portfolio
                </h2>

                <form onSubmit={handleAddHolding} className="space-y-4">
                  <div>
                    <label
                      htmlFor="holding-member"
                      className="mb-1 block text-xs font-medium text-zinc-400"
                    >
                      Family Member
                    </label>
                    <select
                      id="holding-member"
                      value={holdingMemberId}
                      onChange={(e) => setHoldingMemberId(e.target.value)}
                      required
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                    >
                      <option value="" disabled>Select owner...</option>
                      {familyMembers.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
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
                      placeholder="INFY"
                      required
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
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
                      placeholder="10"
                      min="0.01"
                      step="any"
                      required
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
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
                      placeholder="1500.00"
                      min="0.01"
                      step="any"
                      required
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={addLoading}
                    className="w-full rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {addLoading ? "Adding..." : "Add to Portfolio"}
                  </button>
                </form>

                {/* Success Indicator */}
                {addSuccess && (
                  <div className="mt-4 animate-[fadeIn_0.3s_ease-out] rounded-lg border border-emerald-800/50 bg-emerald-950/30 px-4 py-3">
                    <p className="text-sm text-emerald-300">
                      ✓ Stock added successfully!
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
          </div>

          {/* Right Column: Holdings Table Panel */}
          <div className="lg:col-span-2">
            {/* ========== SECTION 3: PORTFOLIO HOLDINGS TABLE ========== */}
            <section className="h-full">
              <div className="h-full rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 shadow-2xl backdrop-blur-sm">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">
                    📊 Portfolio Holdings
                  </h2>
                  <button
                    onClick={fetchHoldings}
                    disabled={holdingsLoading || livePricesLoading}
                    className="text-xs text-zinc-400 transition-colors hover:text-white disabled:opacity-50"
                  >
                    {holdingsLoading || livePricesLoading ? "Refreshing..." : "↻ Refresh"}
                  </button>
                </div>

                {holdingsLoading ? (
                  <div className="flex items-center justify-center py-24">
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
                ) : displayedHoldings.length === 0 ? (
                  <div className="py-24 text-center">
                    <p className="text-zinc-500">
                      No holdings found for the selected filter.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-zinc-700/50 text-[10px] uppercase tracking-wider text-zinc-400">
                          <th className="pb-3 pr-4">Ticker</th>
                          <th className="pb-3 pr-4">Owner</th>
                          <th className="pb-3 pr-4 text-right">Qty</th>
                          <th className="pb-3 pr-4 text-right">Avg Price</th>
                          <th className="pb-3 pr-4 text-right">Live Price</th>
                          <th className="pb-3 pr-4 text-right">P&L</th>
                          <th className="pb-3 text-right">Date Added</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedHoldings.map((h) => {
                          const qty = Number(h.quantity);
                          const buyPrice = Number(h.avg_buy_price);
                          const livePrice = livePrices[h.ticker_symbol];
                          const hasLive =
                            livePrice !== undefined && livePrice !== null;
                          const currentVal = hasLive
                            ? qty * livePrice
                            : qty * buyPrice;
                          const costVal = qty * buyPrice;
                          const indPL = currentVal - costVal;
                          const indPLPercent =
                            costVal > 0 ? (indPL / costVal) * 100 : 0;
                          
                          const owner = familyMembers.find(m => m.id === h.member_id)?.name || "—";

                          return (
                            <tr
                              key={h.id}
                              className="border-b border-zinc-800/50 transition-colors hover:bg-zinc-800/30"
                            >
                              <td className="py-3 pr-4 font-semibold text-white">
                                {h.ticker_symbol}
                              </td>
                              <td className="py-3 pr-4 text-zinc-400">
                                {owner}
                              </td>
                              <td className="py-3 pr-4 text-right text-zinc-300">
                                {h.quantity}
                              </td>
                              <td className="py-3 pr-4 text-right text-zinc-300">
                                ₹
                                {buyPrice.toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </td>
                              <td className="py-3 pr-4 text-right text-zinc-300">
                                {hasLive ? (
                                  `₹${livePrice.toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}`
                                ) : (
                                  <span className="text-zinc-500">—</span>
                                )}
                              </td>
                              <td
                                className={`py-3 pr-4 text-right font-semibold ${
                                  indPL >= 0 ? "text-emerald-400" : "text-red-400"
                                }`}
                              >
                                {hasLive ? (
                                  <div>
                                    <div>
                                      {indPL >= 0 ? "+" : ""}
                                      {indPL.toLocaleString("en-IN", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}
                                    </div>
                                    <div className="text-[10px] font-normal opacity-85">
                                      {indPL >= 0 ? "+" : ""}
                                      {indPLPercent.toFixed(2)}%
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-zinc-500 font-normal">
                                    —
                                  </span>
                                )}
                              </td>
                              <td className="py-3 text-right text-zinc-500">
                                {new Date(h.created_at).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                  }
                                )}
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

        {/* ========== FOOTER ========== */}
        <p className="mt-16 text-center text-xs text-zinc-600">
          Data sourced server-side via yahoo-finance2 · Holdings stored in
          Supabase · Not for trading decisions
        </p>
      </div>
    </div>
  );
}
