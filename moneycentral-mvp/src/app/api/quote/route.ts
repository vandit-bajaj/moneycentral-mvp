import { NextRequest, NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";
import { z } from "zod";

const yahooFinance = new YahooFinance();

const QuoteQuerySchema = z.object({
  symbols: z
    .string()
    .min(1, "At least one symbol is required")
    .max(500, "Too many symbols")
    .regex(/^[A-Z0-9.,\-\^]+$/i, "Symbols must contain only valid ticker characters")
    .optional()
    .nullable(),
  symbol: z
    .string()
    .min(1, "Symbol is required")
    .max(50, "Symbol too long")
    .regex(/^[A-Z0-9.\-\^]+$/i, "Symbol must contain only valid ticker characters")
    .optional()
    .nullable(),
}).refine((data) => data.symbols || data.symbol, {
  message: "Either 'symbols' or 'symbol' query parameter must be provided",
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parsed = QuoteQuerySchema.safeParse({
    symbols: searchParams.get("symbols"),
    symbol: searchParams.get("symbol"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { symbols, symbol } = parsed.data;

  // --- Case 1: Batch Fetching (symbols=INFY.NS,RELIANCE.NS) ---
  if (symbols) {
    const symbolList = symbols.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
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
  if (symbol) {
    const rawSymbol = symbol.trim().toUpperCase();
    const hasExchangeSuffix = rawSymbol.endsWith(".NS") || rawSymbol.endsWith(".BO");
    const ticker = hasExchangeSuffix ? rawSymbol : `${rawSymbol}.NS`;

    try {
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
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      console.error(`[/api/quote] Failed to fetch quote for ${ticker}:`, message);
      return NextResponse.json(
        { error: `Failed to fetch quote for "${ticker}". ${message}` },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ error: "Missing required parameter" }, { status: 400 });
}
