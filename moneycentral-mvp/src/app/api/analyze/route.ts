import { NextResponse } from "next/server";
import { z } from "zod";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "@/lib/env";

const HoldingSchema = z.object({
  ticker_symbol: z
    .string()
    .min(1)
    .max(20)
    .regex(/^[A-Z0-9.\-\^]+$/i),
  quantity: z.number().positive().max(1_000_000),
  avg_buy_price: z.number().positive(),
  current_price: z.number().positive(),
});

const AnalyzeBodySchema = z.object({
  holdings: z.array(HoldingSchema).min(1).max(100),
});

function buildPrompt(holdings: z.infer<typeof HoldingSchema>[]) {
  const summary = holdings
    .map(
      (h) =>
        `${h.ticker_symbol}: ${h.quantity} units @ ₹${h.avg_buy_price} avg, current: ₹${h.current_price}`
    )
    .join("\n");
  
  return `Act as a SEBI-registered financial advisor. I will provide a list of an Indian stock portfolio. Analyze it for sector concentration, risk profile, and overall health. Give a brief, professional summary using markdown formatting. Do not give direct buy/sell advice.\n\nPortfolio Holdings:\n${summary}`;
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = AnalyzeBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { holdings } = parsed.data;

  try {
    const ai = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = buildPrompt(holdings);
    const result = await model.generateContent(prompt);
    
    return NextResponse.json({ summary: result.response.text() });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[/api/analyze] Failed to generate AI analysis:", message);
    return NextResponse.json(
      { error: "Failed to generate AI analysis." },
      { status: 500 }
    );
  }
}
