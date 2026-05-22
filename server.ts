import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client to prevent server crash if the key is not initially present
let aiInstance: GoogleGenAI | null = null;

function getAiClient() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured. Please add your Gemini API key in the Settings > Secrets panel of Google AI Studio.");
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

// 1. Check API Key health
app.get("/api/config", (req, res) => {
  const isKeyAvailable = !!process.env.GEMINI_API_KEY;
  res.json({ isKeyAvailable });
});

// 2. Real-Time Stock Analysis powered by Search Grounding + Structured Schema
app.post("/api/analyze-stock", async (req, res) => {
  const { ticker } = req.body;
  if (!ticker || typeof ticker !== "string") {
    return res.status(400).json({ error: "Ticker symbol is required and must be a string." });
  }

  const symbol = ticker.toUpperCase().trim();

  try {
    const ai = getAiClient();

    const prompt = `
Perform a high-precision, real-time search grounding and financial analysis for the stock ticker "${symbol}".
1. Search Web/Google Search to get the absolute latest live stock price (USD), today's price change (both absolute value change and percentage change), and core statistics (daily highs and lows, 52-week low and high, market capitalization).
2. Look up the most recent fundamental news, quarterly reports, product launches, or macroeconomic pressures impacting "${symbol}".
3. Formulate an expert-level, actionable financial advice outline:
   - Calculate technical trends (e.g., general moving averages, technical signals).
   - Produce a clear, bold recommendation: STRONG_BUY, BUY, HOLD, SELL, or STRONG_SELL.
   - Allocate an investment confidence score ranging from 0 (strong sell warning) to 100 (unconditional buy signal).
   - Author a clear, professional summary discussing direct factors and near-term price catalysts.
   - Specify accurate indicator thresholds:
     * When to buy (ideal price ceiling trigger, core indicators like RSI levels or moving average support crossings).
     * When to sell / take profits (ideal target level to exit, together with a mandatory stop-loss price boundary).
   - Cite news headlines or source links identified during search grounding.

Populate these findings strictly inside the requested JSON response schema. Let the values represent actual real-world numerical trends found during your grounding check.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            ticker: { type: Type.STRING },
            companyName: { type: Type.STRING },
            currentPrice: { type: Type.NUMBER, description: "Current price per share in USD" },
            changeAmount: { type: Type.NUMBER, description: "Daily change amount in USD (positive or negative)" },
            changePercent: { type: Type.NUMBER, description: "Daily change percent (positive or negative e.g., 2.3 or -1.4)" },
            dailyHigh: { type: Type.NUMBER, description: "Daily high price in USD" },
            dailyLow: { type: Type.NUMBER, description: "Daily low price in USD" },
            range52WeekLow: { type: Type.NUMBER, description: "52-week low in USD" },
            range52WeekHigh: { type: Type.NUMBER, description: "52-week high in USD" },
            marketCap: { type: Type.STRING, description: "Market cap string, e.g. 3.12T or 250B" },
            recommendation: { type: Type.STRING, description: "Value MUST be exactly one of: STRONG_BUY, BUY, HOLD, SELL, STRONG_SELL" },
            recommendationScore: { type: Type.NUMBER, description: "Score from 0 (Strong Sell) to 100 (Strong Buy)" },
            summary: { type: Type.STRING, description: "Clear, cohesive summary of current positioning (1-3 lines)" },
            catalysts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 key drivers/conclusions from current market sentiments."
            },
            whenToBuy: {
              type: Type.OBJECT,
              properties: {
                priceIndicator: { type: Type.NUMBER, description: "Entry price threshold in USD" },
                technicalTrigger: { type: Type.STRING, description: "Indicators specifying a buy trigger e.g. 'RSI drops below 35'" },
                description: { type: Type.STRING, description: "Detailed strategy on why and when to buy" }
              },
              required: ["priceIndicator", "technicalTrigger", "description"]
            },
            whenToSell: {
              type: Type.OBJECT,
              properties: {
                priceIndicator: { type: Type.NUMBER, description: "Profit taking price resistance level in USD" },
                stopLoss: { type: Type.NUMBER, description: "Suggested stop loss boundary in USD to limit risks" },
                technicalTrigger: { type: Type.STRING, description: "Technical indicators defining a sell trigger e.g. 'RSI breaks above 75'" },
                description: { type: Type.STRING, description: "Detailed strategy on profit taking / stop executing" }
              },
              required: ["priceIndicator", "stopLoss", "technicalTrigger", "description"]
            },
            newsSources: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "Headline of the article" },
                  url: { type: Type.STRING, description: "Source URL link from grounding citations" },
                  sentiment: { type: Type.STRING, description: "Sentiment value exactly: BULLISH, BEARISH, or NEUTRAL" }
                },
                required: ["title", "sentiment"]
              }
            }
          },
          required: [
            "ticker", "companyName", "currentPrice", "changeAmount", "changePercent",
            "dailyHigh", "dailyLow", "range52WeekLow", "range52WeekHigh", "marketCap",
            "recommendation", "recommendationScore", "summary", "catalysts", "whenToBuy", "whenToSell", "newsSources"
          ]
        }
      }
    });

    const resultText = response.text || "{}";
    res.setHeader("Content-Type", "application/json");
    res.send(resultText);

  } catch (error: any) {
    console.error(`Error analyzing stock ticker ${symbol}:`, error);
    res.status(500).json({
      error: error.message || "An unexpected error occurred during stock analysis.",
    });
  }
});

// Configure Vite middleware in development or static asset serving in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting development mode with Vite live compiler...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Financial Analyst engine running successfully on port ${PORT}`);
  });
}

startServer();
