import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("GEMINI_API_KEY is missing from environment variables.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

export async function POST(request: NextRequest) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI services are not configured correctly (missing API key)." },
        { status: 500 }
      );
    }

    const body = await request.json();

    if (!body || !body.portfolio || !Array.isArray(body.portfolio)) {
      return NextResponse.json(
        { error: "Invalid request payload. Expected an array of portfolio holdings." },
        { status: 400 }
      );
    }

    const portfolioData = JSON.stringify(body.portfolio, null, 2);

    const prompt = `Act as a SEBI-registered financial advisor. I will provide a JSON list of an Indian stock portfolio. Analyze it for sector concentration, risk profile, and overall health. Give a brief, professional summary using markdown formatting. Do not give direct buy/sell advice. Portfolio: ${portfolioData}`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ summary: text });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[/api/analyze] Failed to generate AI analysis:", message);
    return NextResponse.json(
      { error: "Failed to generate AI analysis." },
      { status: 500 }
    );
  }
}
