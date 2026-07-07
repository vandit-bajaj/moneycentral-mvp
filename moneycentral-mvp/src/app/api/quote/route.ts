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
  const rawSymbol = searchParams.get("symbol")?.trim().toUpperCase();

  // --- Validate input ---
  if (!rawSymbol) {
    return NextResponse.json(
      { error: "Missing required query parameter: symbol" },
      { status: 400 }
    );
  }

  // --- Auto-append .NS if no Indian exchange suffix present ---
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
