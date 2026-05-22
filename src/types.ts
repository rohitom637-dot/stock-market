export interface NewsSource {
  title: string;
  url?: string;
  sentiment: "BULLISH" | "BEARISH" | "NEUTRAL";
}

export interface TradingTrigger {
  priceIndicator: number;
  technicalTrigger: string;
  description: string;
}

export interface TradingTriggerWithStopLoss extends TradingTrigger {
  stopLoss: number;
}

export interface StockReport {
  ticker: string;
  companyName: string;
  currentPrice: number;
  changeAmount: number;
  changePercent: number;
  dailyHigh: number;
  dailyLow: number;
  range52WeekLow: number;
  range52WeekHigh: number;
  marketCap: string;
  recommendation: "STRONG_BUY" | "BUY" | "HOLD" | "SELL" | "STRONG_SELL";
  recommendationScore: number; // 0 to 100
  summary: string;
  catalysts: string[];
  whenToBuy: TradingTrigger;
  whenToSell: TradingTriggerWithStopLoss;
  newsSources: NewsSource[];
}

export interface ChartTick {
  time: string; // HH:MM:SS
  timestamp: number;
  price: number;
  volume: number;
  rsi?: number;
  smaFast?: number; // e.g. 5-period
  smaSlow?: number; // e.g. 20-period
}

export interface SimulatedPosition {
  id: string;
  ticker: string;
  type: "BUY" | "SELL";
  buyPrice: number;
  shares: number;
  timestamp: number;
  stopLoss?: number;
  takeProfit?: number;
  isActive: boolean;
  exitPrice?: number;
  exitTimestamp?: number;
  profitOrLoss?: number;
  profitPercent?: number;
}

export interface StockAlert {
  id: string;
  ticker: string;
  type: "PRICE_ABOVE" | "PRICE_BELOW" | "RSI_OVERSOLD" | "RSI_OVERBOUGHT";
  value: number;
  isActive: boolean;
  isTriggered: boolean;
  triggeredAt?: number;
  message: string;
}

export interface TickerDefinition {
  symbol: string;
  name: string;
  basePrice: number;
  volatility: number; // For simulation
}
