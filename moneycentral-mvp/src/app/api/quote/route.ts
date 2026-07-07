import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

/**
 * GET /api/quote?symbol=RELIANCE
 *
 * Fetches a live stock quote from Yahoo Finance.
 * Automatically appends ".NS" (NSE) if no Indian exchange suffix is provided.
 *
 * Returns: { symbol, shortName, price, currency, marketState, timestamp }
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawSymbols = searchParams.get("symbols")?.trim();
  const rawSymbol = searchParams.get("symbol")?.trim().toUpperCase();

  // --- Case 1: Batch Fetching (symbols=INFY.NS,RELIANCE.NS) ---
  if (rawSymbols) {
    const symbolList = rawSymbols.split(",").map(s => s.trim().toUpperCase()).filter(Boolean);
    
    if (symbolList.length === 0) {
      return NextResponse.json(
        { error: "Invalid symbols list" },
        { status: 400 }
      );
    }

    const priceMap: Record<string, number | null> = {};

    try {
      await Promise.all(
        symbolList.map(async (sym) => {
          const hasExchangeSuffix = sym.endsWith(".NS") || sym.endsWith(".BO");
          const ticker = hasExchangeSuffix ? sym : `${sym}.NS`;
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result: any = await yahooFinance.quote(ticker);
            priceMap[sym] = result?.regularMarketPrice ?? null;
          } catch (err) {
            console.error(`[/api/quote] Batch fetch failed for ${ticker}:`, err);
            priceMap[sym] = null;
          }
        })
      );

      return NextResponse.json(priceMap);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      return NextResponse.json(
        { error: `Failed to perform batch fetch: ${message}` },
        { status: 500 }
      );
    }
  }

  // --- Case 2: Single Fetching (symbol=RELIANCE) ---
  if (!rawSymbol) {
    return NextResponse.json(
      { error: "Missing required query parameter: symbol or symbols" },
      { status: 400 }
    );
  }

  const hasExchangeSuffix = rawSymbol.endsWith(".NS") || rawSymbol.endsWith(".BO");
  const ticker = hasExchangeSuffix ? rawSymbol : `${rawSymbol}.NS`;

  try {
    // yahoo-finance2 quote call — cast result to access fields when validateResult is off
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = await yahooFinance.quote(ticker);

    if (!result || result.regularMarketPrice === undefined) {
      return NextResponse.json(
        { error: `No market data found for ticker: ${ticker}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      symbol: result.symbol,
      shortName: result.shortName ?? result.longName ?? ticker,
      price: result.regularMarketPrice,
      previousClose: result.regularMarketPreviousClose ?? null,
      change: result.regularMarketChange ?? null,
      changePercent: result.regularMarketChangePercent ?? null,
      currency: result.currency ?? "INR",
      marketState: result.marketState ?? "UNKNOWN",
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred";

    console.error(`[/api/quote] Failed to fetch quote for ${ticker}:`, message);

    return NextResponse.json(
      { error: `Failed to fetch quote for "${ticker}". ${message}` },
      { status: 500 }
    );
  }
}
