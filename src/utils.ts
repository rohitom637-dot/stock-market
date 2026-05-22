import { ChartTick, TickerDefinition } from "./types";

export const DEFAULT_TICKERS: TickerDefinition[] = [
  { symbol: "AAPL", name: "Apple Inc.", basePrice: 186.40, volatility: 0.12 },
  { symbol: "NVDA", name: "NVIDIA Corporation", basePrice: 915.20, volatility: 0.28 },
  { symbol: "TSLA", name: "Tesla, Inc.", basePrice: 174.60, volatility: 0.25 },
  { symbol: "MSFT", name: "Microsoft Corporation", basePrice: 422.30, volatility: 0.10 },
  { symbol: "GOOGL", name: "Alphabet Inc.", basePrice: 172.10, volatility: 0.14 },
  { symbol: "AMZN", name: "Amazon.com, Inc.", basePrice: 184.80, volatility: 0.13 },
];

/**
 * Simulates a single price tick step using Brownian motion / custom volatility
 */
export function generateNextPrice(prevPrice: number, volatility: number): { price: number; volume: number } {
  // Drift component (slight upward trend on average 0.02%)
  const drift = 0.0002;
  // Stochastic component
  const changePercent = (Math.random() - 0.49) * 2 * (volatility / 100);
  const multiplier = 1 + drift + changePercent;
  
  const price = Math.max(0.5, prevPrice * multiplier);
  const volume = Math.floor(Math.random() * 8000) + 1500;
  
  return { price, volume };
}

/**
 * Calculates Simple Moving Average (SMA) for a given lookback period
 */
export function calculateSMA(ticks: number[], period: number): number | undefined {
  if (ticks.length < period) return undefined;
  const slice = ticks.slice(-period);
  const sum = slice.reduce((a, b) => a + b, 0);
  return sum / period;
}

/**
 * Calculates a simplified RSI (Relative Strength Index) indicator based on typical price deltas
 */
export function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < 2) return 50; // default middle
  
  const actualPeriod = Math.min(prices.length - 1, period);
  const segments = prices.slice(-actualPeriod - 1);
  
  let gains = 0;
  let losses = 0;
  
  for (let i = 1; i < segments.length; i++) {
    const delta = segments[i] - segments[i - 1];
    if (delta > 0) {
      gains += delta;
    } else {
      losses -= delta; // keep positive
    }
  }
  
  if (losses === 0) return 100;
  if (gains === 0) return 0;
  
  const averageGain = gains / actualPeriod;
  const averageLoss = losses / actualPeriod;
  
  const rs = averageGain / averageLoss;
  const rsi = 100 - 100 / (1 + rs);
  
  return rsi;
}
