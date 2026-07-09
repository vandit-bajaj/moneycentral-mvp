import { headers } from "next/headers";
import { NextRequest } from "next/server";
import YahooFinance from "yahoo-finance2";
import { z } from "zod";
import { quoteRatelimit } from "@/lib/ratelimit";
import { apiError, apiSuccess } from "@/lib/api-response";

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
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") ?? headersList.get("x-real-ip") ?? "anonymous";

  const { success, limit, remaining, reset } = await quoteRatelimit.limit(ip);
  if (!success) {
    return apiError(
      "Too many requests. Please wait before fetching quotes again.",
      429,
      {
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": String(remaining),
        "X-RateLimit-Reset": String(reset),
        "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
      }
    );
  }

  const { searchParams } = new URL(request.url);
  const parsed = QuoteQuerySchema.safeParse({
    symbols: searchParams.get("symbols"),
    symbol: searchParams.get("symbol"),
  });

  if (!parsed.success) {
    return apiError(parsed.error.flatten().fieldErrors, 400);
  }

  const { symbols, symbol } = parsed.data;
  const cacheHeaders = {
    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
  };

  // --- Case 1: Batch Fetching (symbols=INFY.NS,RELIANCE.NS) ---
  if (symbols) {
    const symbolList = symbols.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
    if (symbolList.length === 0) {
      return apiError("Invalid symbols list", 400);
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

      return apiSuccess(priceMap, 200, cacheHeaders);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      return apiError(`Failed to perform batch fetch: ${message}`, 500);
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
        return apiError(`No market data found for ticker: ${ticker}`, 404);
      }

      return apiSuccess({
        symbol: result.symbol,
        shortName: result.shortName ?? result.longName ?? ticker,
        price: result.regularMarketPrice,
        previousClose: result.regularMarketPreviousClose ?? null,
        change: result.regularMarketChange ?? null,
        changePercent: result.regularMarketChangePercent ?? null,
        currency: result.currency ?? "INR",
        marketState: result.marketState ?? "UNKNOWN",
        timestamp: new Date().toISOString(),
      }, 200, cacheHeaders);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      console.error(`[/api/quote] Failed to fetch quote for ${ticker}:`, message);
      return apiError(`Failed to fetch quote for "${ticker}". ${message}`, 500);
    }
  }

  return apiError("Missing required parameter", 400);
}
