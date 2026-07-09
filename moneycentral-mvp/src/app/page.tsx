"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { useMembers } from "@/hooks/useMembers";
import { useHoldings } from "@/hooks/useHoldings";
import { SummaryCards } from "@/components/SummaryCards";
import { MemberSelector } from "@/components/MemberSelector";
import { HoldingsTable } from "@/components/HoldingsTable";
import { AIAnalysisPanel } from "@/components/AIAnalysisPanel";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SummaryCardsSkeleton } from "@/components/skeletons/SummaryCardsSkeleton";
import { HoldingsSkeleton } from "@/components/skeletons/HoldingsSkeleton";
import { toast } from "react-hot-toast";

export default function Home() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedFamilyMemberId, setSelectedFamilyMemberId] = useState<string>("ALL");

  // --- Auth Checks ---
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

  // --- Data Fetching ---
  const { data: familyMembers = [] } = useMembers();
  const { data: holdings = [], isLoading: holdingsLoading, refetch: refetchHoldings } = useHoldings();

  // Extract unique symbols
  const symbols = Array.from(new Set(holdings.map((h) => h.ticker_symbol)));

  const {
    data: livePrices = {},
    isFetching: livePricesLoading,
    refetch: refetchPrices,
  } = useQuery<Record<string, number | null>>({
    queryKey: ["livePrices", symbols.join(",")],
    queryFn: async () => {
      if (symbols.length === 0) return {};
      const res = await fetch(`/api/quote?symbols=${encodeURIComponent(symbols.join(","))}`);
      if (!res.ok) throw new Error("Failed to fetch live prices");
      return res.json();
    },
    enabled: symbols.length > 0,
    staleTime: 60 * 1000, // 60 seconds
  });

  const handleRefresh = async () => {
    try {
      await Promise.all([refetchHoldings(), refetchPrices()]);
      toast.success("Prices refreshed successfully!");
    } catch {
      toast.error("Failed to refresh prices.");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

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

  // Filter holdings based on selected family member
  const displayedHoldings = holdings.filter((h) =>
    selectedFamilyMemberId === "ALL" ? true : h.member_id === selectedFamilyMemberId
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 px-4 py-16 text-zinc-100 selection:bg-indigo-500/30">
      <div className="mx-auto max-w-5xl space-y-10">
        
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-850 pb-6">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              MONEYCENTRAL
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Unified Digital Family Office Dashboard
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden flex-col items-end text-xs text-zinc-500 md:flex">
              <span className="font-semibold text-zinc-400">Authenticated user</span>
              <span>{session?.user?.email}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="rounded-xl border border-zinc-700 bg-zinc-800/40 px-5 py-2.5 text-sm font-semibold text-zinc-300 shadow-md backdrop-blur-sm transition-all duration-200 ease-in-out hover:bg-zinc-800 hover:text-white hover:border-zinc-650 hover:shadow-lg active:scale-95"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Dashboard Content under Error Boundary */}
        <ErrorBoundary>
          {holdingsLoading ? (
            <SummaryCardsSkeleton />
          ) : (
            <SummaryCards
              holdings={displayedHoldings}
              livePrices={livePrices}
              livePricesLoading={livePricesLoading}
            />
          )}

          <MemberSelector
            familyMembers={familyMembers}
            selectedFamilyMemberId={selectedFamilyMemberId}
            setSelectedFamilyMemberId={setSelectedFamilyMemberId}
            userId={session.user.id}
          />

          <AIAnalysisPanel
            holdings={displayedHoldings}
            livePrices={livePrices}
          />

          {holdingsLoading ? (
            <HoldingsSkeleton />
          ) : (
            <HoldingsTable
              holdings={holdings}
              displayedHoldings={displayedHoldings}
              isLoading={holdingsLoading}
              familyMembers={familyMembers}
              livePrices={livePrices}
              livePricesLoading={livePricesLoading}
              onRefreshPrices={handleRefresh}
              userId={session.user.id}
            />
          )}
        </ErrorBoundary>

      </div>
    </div>
  );
}
