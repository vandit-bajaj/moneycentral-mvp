"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
/*  Format Utilities                                                   */
/* ------------------------------------------------------------------ */

function formatINR(value: number): string {
  const isNegative = value < 0;
  const absValue = Math.abs(value);
  const formatted = absValue.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${isNegative ? "-" : ""}₹${formatted}`;
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function Home() {
  const router = useRouter();

  /* ---- Auth State ---- */
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

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
  /*  Session & Auth Check                                             */
  /* ================================================================ */

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      } else {
        setSession(session);
        setAuthLoading(false);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push("/login");
      } else {
        setSession(session);
        setAuthLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

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
    if (session) {
      fetchFamilyMembers();
    }
  }, [session, fetchFamilyMembers]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !session?.user?.id) return;

    setAddMemberLoading(true);
    const { error } = await supabase.from("family_members").insert({
      name: newMemberName.trim(),
      user_id: session.user.id,
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
    if (session) {
      fetchHoldings();
    }
  }, [session, fetchHoldings]);

  /* ================================================================ */
  /*  Add Holding to Supabase                                          */
  /* ================================================================ */

  const handleAddHolding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;

    setAddLoading(true);
    setAddError(null);
    setAddSuccess(false);

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
      user_id: session.user.id,
    });

    if (error) {
      setAddError(error.message);
    } else {
      setAddSuccess(true);
      setHoldingSymbol("");
      setHoldingQty("");
      setHoldingPrice("");
      setHoldingMemberId("");
      fetchHoldings();
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

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <svg className="h-8 w-8 animate-spin text-zinc-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 px-4 py-16 text-zinc-100 selection:bg-indigo-500/30">
      <div className="mx-auto max-w-5xl space-y-10">
        
        {/* ========== HEADER ========== */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-8">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              MoneyCentral
            </h1>
            <p className="mt-2 text-sm text-zinc-400 font-medium">
              Digital Family Office · Premium Wealth Intelligence
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden flex-col items-end text-xs text-zinc-500 md:flex">
              <span className="font-semibold text-zinc-400">Authenticated user</span>
              <span>{session?.user?.email}</span>
            </div>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.push("/login");
              }}
              className="rounded-xl border border-zinc-700 bg-zinc-800/40 px-5 py-2.5 text-sm font-semibold text-zinc-300 shadow-md backdrop-blur-sm transition-all duration-200 ease-in-out hover:bg-zinc-800 hover:text-white hover:border-zinc-650 hover:shadow-lg active:scale-95"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* ========== SECTION: FAMILY OFFICE CONTROLS ========== */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Family Members Office */}
          <div className="rounded-2xl border border-zinc-850 bg-zinc-900/40 p-6 backdrop-blur-md shadow-xl transition-all duration-200 hover:border-zinc-800">
            <h2 className="mb-4 text-base font-semibold text-white flex items-center gap-2">
              <span>👨‍👩‍👧‍👦</span> Family Members Office
            </h2>
            <form onSubmit={handleAddMember} className="flex gap-3">
              <input
                type="text"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder="Enter member's name (e.g. Mom, Dad)"
                className="flex-1 rounded-xl border border-zinc-750 bg-zinc-900/60 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
                required
              />
              <button
                type="submit"
                disabled={addMemberLoading}
                className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-indigo-500 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              >
                {addMemberLoading ? "Adding..." : "Add"}
              </button>
            </form>
          </div>

          {/* Filter Dropdown */}
          <div className="rounded-2xl border border-zinc-850 bg-zinc-900/40 p-6 backdrop-blur-md shadow-xl flex flex-col justify-center transition-all duration-200 hover:border-zinc-800">
            <label className="mb-2 block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Filter Portfolio view
            </label>
            <select
              value={selectedFamilyMemberId}
              onChange={(e) => setSelectedFamilyMemberId(e.target.value)}
              className="w-full rounded-xl border border-zinc-750 bg-zinc-900/60 px-4 py-3.5 text-sm text-white outline-none transition-all duration-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20"
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

        {/* ========== SECTION 0.5: AI PORTFOLIO INSIGHTS ========== */}
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
                disabled={aiInsightsLoading || displayedHoldings.length === 0}
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
            {aiInsightsError && (
              <div className="rounded-xl border border-rose-950 bg-rose-950/20 px-4 py-3">
                <p className="text-sm text-rose-400">✕ {aiInsightsError}</p>
              </div>
            )}
            
            {aiInsights && (
              <div className="prose prose-invert max-w-none text-sm text-zinc-300 mt-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 leading-relaxed shadow-inner">
                <ReactMarkdown>{aiInsights}</ReactMarkdown>
              </div>
            )}
            
            {!aiInsights && !aiInsightsLoading && !aiInsightsError && (
              <div className="text-center py-8 text-sm text-zinc-500 italic rounded-xl border border-dashed border-zinc-800/80 bg-zinc-900/10">
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
                    disabled={addLoading || familyMembers.length === 0}
                    className="w-full rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-indigo-500 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                  >
                    {addLoading ? "Adding..." : "Add to Portfolio"}
                  </button>
                </form>

                {/* Success Indicator */}
                {addSuccess && (
                  <div className="mt-4 rounded-xl border border-emerald-950 bg-emerald-950/20 px-4 py-3">
                    <p className="text-xs text-emerald-450">
                      ✓ Stock added successfully!
                    </p>
                  </div>
                )}

                {/* Error Indicator */}
                {addError && (
                  <div className="mt-4 rounded-xl border border-rose-950 bg-rose-950/20 px-4 py-3">
                    <p className="text-xs text-rose-450">✕ {addError}</p>
                  </div>
                )}
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
                    onClick={fetchHoldings}
                    disabled={holdingsLoading || livePricesLoading}
                    className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors duration-200 disabled:opacity-50"
                  >
                    {holdingsLoading || livePricesLoading ? "Refreshing..." : "↻ Refresh"}
                  </button>
                </div>

                {holdingsLoading ? (
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
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-850/50">
                        {displayedHoldings.map((h) => {
                          const qty = Number(h.quantity);
                          const buyPrice = Number(h.avg_buy_price);
                          const livePrice = livePrices[h.ticker_symbol];
                          const hasLive = livePrice !== undefined && livePrice !== null;
                          const currentVal = hasLive ? qty * livePrice : qty * buyPrice;
                          const costVal = qty * buyPrice;
                          const indPL = currentVal - costVal;
                          const indPLPercent = costVal > 0 ? (indPL / costVal) * 100 : 0;
                          
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
                                  formatINR(livePrice)
                                ) : (
                                  <span className="text-zinc-650">—</span>
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
                                  <span className="text-zinc-650 font-normal">—</span>
                                )}
                              </td>
                              <td className="py-4 text-right text-xs text-zinc-500">
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
        <p className="text-center text-xs text-zinc-600 pt-8 border-t border-zinc-850">
          Data sourced server-side via yahoo-finance2 · Secured family asset store · Not financial advice
        </p>
      </div>
    </div>
  );
}
