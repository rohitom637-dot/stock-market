import React, { useState, useEffect, useRef } from "react";
import {
  StockReport,
  SimulatedPosition,
  StockAlert,
  ChartTick,
  TickerDefinition,
} from "./types";
import {
  DEFAULT_TICKERS,
  generateNextPrice,
  calculateSMA,
  calculateRSI,
} from "./utils";
import { StockChart } from "./components/StockChart";
import { AdvisorReport } from "./components/AdvisorReport";
import { SimulatedPortfolio } from "./components/SimulatedPortfolio";
import { AlertManager } from "./components/AlertManager";
import { motion, AnimatePresence } from "motion/react";
import {
  TrendingUp,
  TrendingDown,
  Search,
  Layers,
  AlertTriangle,
  Play,
  Pause,
  Volume2,
  VolumeX,
} from "lucide-react";

export default function App() {
  // Current selecting state
  const [activeTicker, setActiveTicker] = useState<string>("AAPL");
  const [tickers, setTickers] = useState<TickerDefinition[]>(DEFAULT_TICKERS);
  
  // Ticks histories by Ticker
  const [ticksMap, setTicksMap] = useState<Record<string, ChartTick[]>>({});
  
  // AI Advice Reports loaded by Ticker
  const [reportsMap, setReportsMap] = useState<Record<string, StockReport>>({});
  const [reportLoading, setReportLoading] = useState<boolean>(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // Search input
  const [searchQuery, setSearchQuery] = useState<string>(" ");
  // Note: we start searchQuery with clean empty state
  useEffect(() => {
    setSearchQuery("");
  }, []);

  const [searchError, setSearchError] = useState<string | null>(null);

  // Back-end key accessibility state
  const [keyAvailable, setKeyAvailable] = useState<boolean>(true);

  // Trading simulation states
  const [positions, setPositions] = useState<SimulatedPosition[]>([]);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  
  // App Notification Event Feed
  const [eventLogs, setEventLogs] = useState<Array<{ id: string; time: string; text: string; type: "INFO" | "BUY" | "SELL" | "ALERT" }>>([]);

  // Option Toggles
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showIndicators, setShowIndicators] = useState<boolean>(true);

  // Prevent duplicate interval seeding
  const tickTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Helpers to fetch API health initially
  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => {
        setKeyAvailable(data.isKeyAvailable);
      })
      .catch(() => {
        setKeyAvailable(true); // default fallback
      });
  }, []);

  // Play synthesized audio warning bleeps in-browser
  const triggerAudioBeep = (isPositive: boolean) => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(isPositive ? 880 : 440, ctx.currentTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {
      // Ignored browser autoplays constraints block
    }
  };

  // Log notifications to terminal feed
  const logEvent = (text: string, type: "INFO" | "BUY" | "SELL" | "ALERT") => {
    const timeString = new Date().toLocaleTimeString();
    setEventLogs((prev) => [
      { id: Math.random().toString(), time: timeString, text, type },
      ...prev.slice(0, 49), // cap at 50 logs of history
    ]);
  };

  // Seed initial 35 historical ticks for each ticker on initial launch
  useEffect(() => {
    const initialMap: Record<string, ChartTick[]> = {};
    const now = Date.now();

    tickers.forEach((t) => {
      let currentPrice = t.basePrice;
      const tTicks: ChartTick[] = [];

      for (let i = 35; i >= 0; i--) {
        const fakeTime = new Date(now - i * 2000);
        const { price, volume } = generateNextPrice(currentPrice, t.volatility);
        currentPrice = price;

        const pricesSlice = tTicks.map((x) => x.price).concat(price);
        const fastSma = calculateSMA(pricesSlice, 5);
        const slowSma = calculateSMA(pricesSlice, 15);
        const rsiVal = calculateRSI(pricesSlice, 14);

        tTicks.push({
          time: fakeTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          timestamp: fakeTime.getTime(),
          price,
          volume,
          smaFast: fastSma,
          smaSlow: slowSma,
          rsi: rsiVal,
        });
      }
      initialMap[t.symbol] = tTicks;
    });

    setTicksMap(initialMap);
    logEvent("Real-time analytical pipelines initialized with 14-period RSI filters.", "INFO");
    
    // Automatically trigger initial advisory analysis for the default asset (AAPL)
    triggerAdvisorRequest("AAPL");
  }, []);

  // Ticker Interval Engine: Runs simulation random-walk every 2 seconds
  useEffect(() => {
    if (tickTimerRef.current) clearInterval(tickTimerRef.current);

    if (!isSimulating) return;

    tickTimerRef.current = setInterval(() => {
      setTicksMap((prevMap) => {
        const nextMap = { ...prevMap };
        const now = Date.now();
        const nowStr = new Date(now).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

        tickers.forEach((t) => {
          const pastTicks = prevMap[t.symbol] || [];
          if (pastTicks.length === 0) return;

          const latestTick = pastTicks[pastTicks.length - 1];
          const { price: nextPrice, volume: nextVolume } = generateNextPrice(latestTick.price, t.volatility);

          const pricesList = pastTicks.map((x) => x.price).concat(nextPrice);
          const fastSma = calculateSMA(pricesList, 5);
          const slowSma = calculateSMA(pricesList, 15);
          const rsiVal = calculateRSI(pricesList, 14);

          const newTick: ChartTick = {
            time: nowStr,
            timestamp: now,
            price: nextPrice,
            volume: nextVolume,
            smaFast: fastSma,
            smaSlow: slowSma,
            rsi: rsiVal,
          };

          nextMap[t.symbol] = [...pastTicks.slice(-45), newTick];

          if (t.symbol === activeTicker) {
            evaluateRiskGuards(t.symbol, nextPrice, rsiVal, now);
            evaluateIndicatorAlarms(t.symbol, nextPrice, rsiVal, now);
          }
        });

        return nextMap;
      });
    }, 2000);

    return () => {
      if (tickTimerRef.current) clearInterval(tickTimerRef.current);
    };
  }, [tickers, activeTicker, isSimulating, positions, alerts]);

  // Evaluates Auto Take Profit & Stop Loss parameters on active trades
  const evaluateRiskGuards = (ticker: string, price: number, rsi: number, timestamp: number) => {
    setPositions((prevPositions) => {
      return prevPositions.map((pos) => {
        if (!pos.isActive || pos.ticker !== ticker) return pos;

        // Evaluate Stop Loss Breach
        if (pos.stopLoss && price <= pos.stopLoss) {
          const profit = (price - pos.buyPrice) * pos.shares;
          const profitPct = ((price - pos.buyPrice) / pos.buyPrice) * 100;
          triggerAudioBeep(false);
          logEvent(
            `RISK GUARD: Stop Loss boundary breached on ${ticker} at $${price.toFixed(2)}. Closed simulated position automatically. Unrealized loss capped: $${profit.toFixed(2)}`,
            "SELL"
          );
          return {
            ...pos,
            isActive: false,
            exitPrice: price,
            exitTimestamp: timestamp,
            profitOrLoss: profit,
            profitPercent: profitPct,
          };
        }

        // Evaluate Take Profit Level Met
        if (pos.takeProfit && price >= pos.takeProfit) {
          const profit = (price - pos.buyPrice) * pos.shares;
          const profitPct = ((price - pos.buyPrice) / pos.buyPrice) * 100;
          triggerAudioBeep(true);
          logEvent(
            `RISK GUARD: Take Profit target unlocked on ${ticker} at $${price.toFixed(2)}. Position automatically secured at peak! Return: +$${profit.toFixed(2)}`,
            "SELL"
          );
          return {
            ...pos,
            isActive: false,
            exitPrice: price,
            exitTimestamp: timestamp,
            profitOrLoss: profit,
            profitPercent: profitPct,
          };
        }

        return pos;
      });
    });
  };

  // Evaluates custom alarms set by the user
  const evaluateIndicatorAlarms = (ticker: string, price: number, rsi: number, timestamp: number) => {
    setAlerts((prevAlerts) => {
      let hasChange = false;
      const nextAlerts = prevAlerts.map((alert) => {
        if (!alert.isActive || alert.isTriggered || alert.ticker !== ticker) return alert;

        let triggers = false;
        let msg = "";

        if (alert.type === "PRICE_ABOVE" && price >= alert.value) {
          triggers = true;
          msg = `Simulated price climb: ${ticker} surpassed Price ceiling $${alert.value.toFixed(2)}! Sell signal achieved to claim profits.`;
        } else if (alert.type === "PRICE_BELOW" && price <= alert.value) {
          triggers = true;
          msg = `Simulated price drop: ${ticker} slipped below purchase support $${alert.value.toFixed(2)}! Consider entry buy or stop.`;
        } else if (alert.type === "RSI_OVERBOUGHT" && rsi >= alert.value) {
          triggers = true;
          msg = `Technical oscillator: ${ticker} RSI reached overbought range at ${rsi.toFixed(1)}! Extremely high probability sell trigger.`;
        } else if (alert.type === "RSI_OVERSOLD" && rsi <= alert.value) {
          triggers = true;
          msg = `Technical oscillator: ${ticker} RSI oversold at ${rsi.toFixed(1)}! Excellent entry window to invest.`;
        }

        if (triggers) {
          hasChange = true;
          triggerAudioBeep(alert.type === "RSI_OVERSOLD" || alert.type === "PRICE_BELOW");
          logEvent(`TECHNICAL SIGNAL: ${msg}`, "ALERT");
          return {
            ...alert,
            isTriggered: true,
            isActive: false,
            triggeredAt: timestamp,
            message: msg,
          };
        }

        return alert;
      });

      return hasChange ? nextAlerts : prevAlerts;
    });
  };

  // Fetch Report from Search Grounded Gemini API
  const triggerAdvisorRequest = async (symbol: string) => {
    setReportLoading(true);
    setReportError(null);

    try {
      const response = await fetch("/api/analyze-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker: symbol }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Server failed to deliver stock advisory.");
      }

      const report: StockReport = await response.json();
      
      setReportsMap((prev) => ({ ...prev, [symbol]: report }));
      logEvent(`AI ADVICE UNLOCKED: Search grounded analyst generated strategic parameters for ${symbol}. Buying threshold: $${report.whenToBuy.priceIndicator.toFixed(2)}`, "INFO");

    } catch (err: any) {
      console.error(err);
      setReportError(err.message || "Could not generate report. Please recheck your credentials.");
      logEvent(`AI Advisory failed for ${symbol}: ${err.message}`, "ALERT");
    } finally {
      setReportLoading(false);
    }
  };

  // Handle Search input
  const handleSearchTicker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    const query = searchQuery.toUpperCase().trim();
    setSearchError(null);

    const existing = tickers.find((t) => t.symbol === query);
    if (existing) {
      setActiveTicker(query);
      setSearchQuery("");
      return;
    }

    setReportLoading(true);
    try {
      const response = await fetch("/api/analyze-stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker: query }),
      });

      if (!response.ok) {
        throw new Error(`Ticker symbol "${query}" was not found or failed grounding search validation.`);
      }

      const newReport: StockReport = await response.json();

      const newTicker: TickerDefinition = {
        symbol: query,
        name: newReport.companyName,
        basePrice: newReport.currentPrice,
        volatility: 0.15,
      };

      setTickers((prev) => [...prev, newTicker]);
      
      const now = Date.now();
      let price = newReport.currentPrice;
      const ticks: ChartTick[] = [];
      for (let i = 35; i >= 0; i--) {
        const fakeTime = new Date(now - i * 2000);
        const { price: stepPrice, volume } = generateNextPrice(price, 0.15);
        price = stepPrice;

        const pricesSlice = ticks.map((x) => x.price).concat(price);
        ticks.push({
          time: fakeTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          timestamp: fakeTime.getTime(),
          price,
          volume,
          smaFast: calculateSMA(pricesSlice, 5),
          smaSlow: calculateSMA(pricesSlice, 15),
          rsi: calculateRSI(pricesSlice, 14),
        });
      }

      setTicksMap((prev) => ({ ...prev, [query]: ticks }));
      setReportsMap((prev) => ({ ...prev, [query]: newReport }));
      setActiveTicker(query);
      
      logEvent(`Ticker resolved via search grounding: Added ${query} (${newReport.companyName}) to listings.`, "INFO");
      setSearchQuery("");
    } catch (err: any) {
      setSearchError(err.message || "Failed to search ticker symbol.");
      logEvent(`Search of ticker failed for ${query}`, "ALERT");
    } finally {
      setReportLoading(false);
    }
  };

  // Submit buy order
  const handlePlaceTrade = (
    type: "BUY" | "SELL",
    shares: number,
    stopLoss?: number,
    takeProfit?: number
  ) => {
    const activePrice = getActivePrice();
    const cost = activePrice * shares;

    const newPosition: SimulatedPosition = {
      id: Math.random().toString(),
      ticker: activeTicker,
      type,
      buyPrice: activePrice,
      shares,
      timestamp: Date.now(),
      stopLoss,
      takeProfit,
      isActive: true,
    };

    setPositions((prev) => [...prev, newPosition]);
    triggerAudioBeep(true);
    logEvent(
      `TRADE LOGGED: Invested by buying ${shares} shares of ${activeTicker} at $${activePrice.toFixed(2)} (Value: $${cost.toFixed(2)})`,
      "BUY"
    );
  };

  // Sell order
  const handleExitTrade = (id: string, currentPrice: number) => {
    setPositions((prev) =>
      prev.map((pos) => {
        if (pos.id !== id) return pos;
        const profit = (currentPrice - pos.buyPrice) * pos.shares;
        const profitPct = ((currentPrice - pos.buyPrice) / pos.buyPrice) * 105;

        triggerAudioBeep(profit >= 0);
        logEvent(
          `TRADE LOGGED: Realized investment earnings on ${pos.ticker}. Sold ${pos.shares} shares at $${currentPrice.toFixed(2)}. Total Returns: ${profit >= 0 ? "+" : ""}$${profit.toFixed(2)} (${profitPct.toFixed(2)}%)`,
          "SELL"
        );

        return {
          ...pos,
          isActive: false,
          exitPrice: currentPrice,
          exitTimestamp: Date.now(),
          profitOrLoss: profit,
          profitPercent: profitPct,
        };
      })
    );
  };

  // Manage alerts
  const handleAddAlert = (
    type: "PRICE_ABOVE" | "PRICE_BELOW" | "RSI_OVERSOLD" | "RSI_OVERBOUGHT",
    value: number
  ) => {
    const newAlert: StockAlert = {
      id: Math.random().toString(),
      ticker: activeTicker,
      type,
      value,
      isActive: true,
      isTriggered: false,
      message: `Conditional target initialized for ${activeTicker}`,
    };

    setAlerts((prev) => [...prev, newAlert]);
    logEvent(`ALERT TRIGGER: Subscribed to technical indicator limits on ${activeTicker}.`, "INFO");
  };

  const handleRemoveAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  // Get active price securely
  const getActivePrice = (): number => {
    const activeTicks = ticksMap[activeTicker] || [];
    if (activeTicks.length > 0) {
      return activeTicks[activeTicks.length - 1].price;
    }
    const match = tickers.find((t) => t.symbol === activeTicker);
    return match ? match.basePrice : 100.0;
  };

  const getPercentChange = (): { amount: number; pct: number } => {
    const activeTicks = ticksMap[activeTicker] || [];
    if (activeTicks.length < 2) return { amount: 0, pct: 0 };
    const latest = activeTicks[activeTicks.length - 1].price;
    const initial = activeTicks[0].price;
    const amount = latest - initial;
    const pct = (amount / initial) * 100;
    return { amount, pct };
  };

  const activePrice = getActivePrice();
  const activeChange = getPercentChange();
  const currentReport = reportsMap[activeTicker] || null;

  const activeTicksList = ticksMap[activeTicker] || [];
  const latestRsi = activeTicksList.length > 0 ? activeTicksList[activeTicksList.length - 1].rsi : 50;
  
  let rsiStatus = "NEUTRAL";
  if (latestRsi >= 70) {
    rsiStatus = "OVERBOUGHT";
  } else if (latestRsi <= 30) {
    rsiStatus = "OVERSOLD";
  }

  // Real-time account equity mathematics
  const activeHoldings = positions.filter((p) => p.isActive);
  const historyHoldings = positions.filter((p) => !p.isActive);
  const initialBalance = 100000;
  
  const totalPurchaseCosts = activeHoldings.reduce((sum, p) => sum + p.buyPrice * p.shares, 0);
  const totalExitedProfits = historyHoldings.reduce((sum, p) => sum + (p.profitOrLoss || 0), 0);
  
  const currentCash = initialBalance - totalPurchaseCosts + totalExitedProfits;
  
  const totalActiveCapital = activeHoldings.reduce((sum, p) => {
    const currentPriceToken = p.ticker === activeTicker ? activePrice : p.buyPrice;
    return sum + currentPriceToken * p.shares;
  }, 0);

  const totalPortfolioValue = currentCash + totalActiveCapital;
  const netProfit = totalPortfolioValue - initialBalance;
  const totalProfitPercent = (netProfit / initialBalance) * 100;

  return (
    <div className="bg-[#09090b] min-h-screen text-slate-300 font-sans flex flex-col selection:bg-emerald-550 selection:text-black">
      
      {/* 1. Header Navigation HUD */}
      <header className="h-14 border-b border-slate-800 flex items-center justify-between px-4 sm:px-6 bg-[#09090b] sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-emerald-500 rounded flex items-center justify-center">
            <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
            </svg>
          </div>
          <h1 className="text-xs sm:text-sm font-black text-white tracking-widest font-mono uppercase">
            QUANTUM ANALYTICS <span className="text-emerald-400 font-normal">v2.4</span>
          </h1>
          <div className="h-4 w-[1px] bg-slate-800 mx-1 hidden sm:block"></div>
          
          <span className="text-[9px] font-mono text-emerald-400 flex items-center gap-1.5 bg-emerald-950/20 border border-emerald-900/40 px-2 py-0.5 rounded-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="hidden xs:inline">NASDAQ FEED LIVE</span>
          </span>
        </div>

        {/* Dynamic Live HUD Telemetry */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="text-right">
            <div className="text-[8px] uppercase text-slate-500 font-black tracking-widest font-mono">Sim Balance</div>
            <div className="text-xs font-mono font-bold text-white flex items-baseline gap-1">
              <span>${totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
              <span className={`text-[9px] font-bold ${netProfit >= 0 ? "text-emerald-400" : "text-rose-455"}`}>
                {netProfit >= 0 ? "+" : ""}{totalProfitPercent.toFixed(1)}%
              </span>
            </div>
          </div>
          
          <div className="h-8 w-[1px] bg-slate-800 hidden sm:block"></div>

          {/* Engine control HUD buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsSimulating(!isSimulating)}
              className={`p-1.5 rounded-sm border text-[8px] font-mono tracking-wider uppercase font-bold cursor-pointer flex items-center gap-1.5 transition ${isSimulating ? "bg-emerald-950/20 text-emerald-400 border-emerald-900" : "bg-slate-900 text-slate-500 border-slate-800"}`}
              title={isSimulating ? "Pause Simulation random walk" : "Resume Simulation"}
            >
              {isSimulating ? <Pause size={10} className="animate-pulse" /> : <Play size={10} />}
              <span className="hidden md:inline">{isSimulating ? "PAUSE FEED" : "PLAY FEED"}</span>
            </button>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded-sm bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition border border-slate-800 cursor-pointer"
              title={soundEnabled ? "Mute audio warning effects" : "Enable alarm sound warnings"}
            >
              {soundEnabled ? <Volume2 size={11} /> : <VolumeX size={11} />}
            </button>
            
            <button
              onClick={() => setShowIndicators(!showIndicators)}
              className={`text-[8px] font-mono tracking-wider font-bold px-2 py-1.5 border rounded-sm cursor-pointer transition ${showIndicators ? "bg-slate-800 border-slate-700 text-slate-350" : "bg-slate-900 border-slate-850 text-slate-600"}`}
            >
              <span className="hidden sm:inline">INDICATORS: </span>{showIndicators ? "ON" : "OFF"}
            </button>
          </div>
        </div>
      </header>

      {/* 2. Credentials alerting strip */}
      {!keyAvailable && (
        <div className="bg-amber-950/25 border-b border-amber-900/40 px-4 py-2 flex items-center justify-between text-[10px] font-mono uppercase text-amber-300">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="text-amber-500" size={12} />
            <span>WARNING: GEMINI_API_KEY NOT CONFIGURED • ANALYSIS RUNS IN DEMO MODE</span>
          </div>
          <a
            href="https://ai.studio/build"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-amber-100 font-black"
          >
            CONFIGURE SECRETS
          </a>
        </div>
      )}

      {/* 3. Main Workspace Grid */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Watchlist Navigation Sidebar (Left) */}
        <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-800 bg-[#0b0b0e] flex flex-col flex-shrink-0">
          <div className="p-3 border-b border-slate-800 bg-slate-900/30">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">
              REAL-TIME WATCHLIST
            </span>
          </div>

          {/* Active List content */}
          <div className="flex-1 max-h-56 md:max-h-none overflow-y-auto">
            {tickers.map((t) => {
              const active = t.symbol === activeTicker;
              const activeTicks = ticksMap[t.symbol] || [];
              let priceVal = t.basePrice;
              let changePct = 0;
              if (activeTicks.length > 0) {
                priceVal = activeTicks[activeTicks.length - 1].price;
                if (activeTicks.length >= 2) {
                  const initial = activeTicks[0].price;
                  changePct = ((priceVal - initial) / initial) * 100;
                }
              }
              const isUpValue = changePct >= 0;

              return (
                <div
                  key={t.symbol}
                  onClick={() => {
                    setActiveTicker(t.symbol);
                    if (!reportsMap[t.symbol]) {
                      triggerAdvisorRequest(t.symbol);
                    }
                  }}
                  className={`p-3 border-b border-slate-800/60 flex justify-between items-center hover:bg-slate-800/30 cursor-pointer transition ${active ? "bg-slate-800/20 border-l-2 border-emerald-500" : "border-l-2 border-transparent"}`}
                >
                  <div className="min-w-0">
                    <div className="text-xs font-black text-white font-mono flex items-center gap-1">
                      <span>{t.symbol}</span>
                      {active && <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />}
                    </div>
                    <div className="text-[9px] text-slate-500 truncate max-w-[150px] font-sans uppercase font-medium mt-0.5">
                      {t.name}
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <div className={`text-xs font-bold leading-none ${isUpValue ? "text-emerald-400" : "text-rose-400"}`}>
                      ${priceVal.toFixed(2)}
                    </div>
                    <div className={`text-[8px] font-bold mt-1 ${isUpValue ? "text-emerald-500" : "text-rose-500"}`}>
                      {isUpValue ? "+" : ""}{changePct.toFixed(2)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dynamic search console at the sidebar bottom */}
          <div className="p-3 border-t border-slate-800 bg-[#09090b] mt-auto">
            <form onSubmit={handleSearchTicker} className="space-y-1.5">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest font-mono">
                GROUND SEARCH ASSET
              </span>
              <div className="relative">
                <Search className="absolute left-2.5 top-2 text-slate-500" size={11} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="EX. NFLX, COIN"
                  className="w-full bg-[#0b0b0e] text-[10px] text-white pl-7 pr-2 py-1.5 rounded-sm border border-slate-800 outline-none focus:border-slate-600 font-bold font-mono placeholder-slate-650"
                />
              </div>
              <button
                type="submit"
                disabled={reportLoading}
                className="w-full bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:text-emerald-400 text-slate-400 text-[9px] font-mono font-bold py-1 px-2 rounded-sm transition uppercase disabled:text-slate-600 cursor-pointer"
              >
                {reportLoading ? "VALIDATING..." : "ADD ASSET TO SIM"}
              </button>
            </form>
          </div>
        </aside>

        {/* Central Grid and Reports Section */}
        <section className="flex-1 flex flex-col p-4 space-y-4 overflow-y-auto bg-[#09090b]">
          
          {searchError && (
            <div className="p-2.5 bg-rose-950/20 border border-rose-900/30 rounded-sm text-rose-450 font-mono text-[10px] flex gap-2 items-center uppercase">
              <AlertTriangle size={12} className="text-rose-500" />
              <span>{searchError}</span>
            </div>
          )}

          {/* Asset Info Header block matches exact Quantum theme */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-900/40 border border-slate-800 rounded p-3 flex flex-col justify-center">
              <div className="text-[9px] uppercase text-slate-500 font-black font-mono tracking-widest mb-1">
                Selected Asset Identity
              </div>
              <div className="text-sm font-mono text-white font-black uppercase">
                {tickers.find((t) => t.symbol === activeTicker)?.name || activeTicker}
              </div>
              <div className="text-[9px] text-slate-500 font-mono uppercase mt-0.5">
                Active target code: {activeTicker}/USD
              </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 rounded p-3 flex flex-col justify-center font-mono">
              <div className="text-[9px] uppercase text-slate-500 font-black tracking-widest mb-1">
                Live Tick Price Index
              </div>
              <div className="text-lg font-black text-emerald-400">
                ${activePrice.toFixed(2)} <span className="text-[10px] text-slate-500 font-normal">USD</span>
              </div>
              <div className="text-[9px] text-slate-500 uppercase mt-0.5">
                Real-time generated tick indices
              </div>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 rounded p-3 flex flex-col justify-center font-mono">
              <div className="text-[9px] uppercase text-slate-500 font-black tracking-widest mb-1">
                Interval Profit Shift
              </div>
              <div className={`text-lg font-black ${activeChange.amount >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {activeChange.amount >= 0 ? "+" : ""}
                {activeChange.amount.toFixed(2)} ({activeChange.amount >= 0 ? "+" : ""}
                {activeChange.pct.toFixed(2)}%)
              </div>
              <div className="text-[9px] text-slate-500 uppercase mt-0.5">
                Calculated slide delta
              </div>
            </div>
          </div>

          {/* Live Dynamic Recharts Area */}
          <StockChart
            ticks={ticksMap[activeTicker] || []}
            ticker={activeTicker}
            positions={positions}
            showIndicators={showIndicators}
          />

          {/* Indicators Bar matches Quantum layout perfectly */}
          {ticksMap[activeTicker] && ticksMap[activeTicker].length > 0 && (
            <div className="p-3 bg-slate-950 rounded border border-slate-800/80 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
              <div className="flex items-center gap-3 font-mono">
                <div className="text-[8px] text-slate-500 uppercase font-black tracking-wider">LIVE INDICATORS</div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[8px] bg-slate-900 px-2 py-0.5 rounded-sm border border-slate-800 text-emerald-400 uppercase font-black font-mono">
                    RSI: {latestRsi.toFixed(1)} {rsiStatus}
                  </span>
                  <span className="text-[8px] bg-slate-900 px-2 py-0.5 rounded-sm border border-slate-800 text-sky-400 uppercase font-black">
                    MACD: OSC STABLE
                  </span>
                  <span className="text-[8px] bg-slate-900 px-2 py-0.5 rounded-sm border border-slate-800 text-amber-500 uppercase font-black">
                    SMA DEV: {(activePrice * 0.005).toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="text-[9px] text-slate-500 font-mono tracking-tighter uppercase self-end sm:self-auto">
                WATCHDOG CYCLE ACTIVE • {new Date().toLocaleTimeString()}
              </div>
            </div>
          )}

          {/* Intelligence advisor summary card reports */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-[10px] font-black text-slate-400 tracking-widest font-mono uppercase">
                AI COGNITIVE ADVICE RESEARCH GROUNDING CORE
              </span>
              <button
                onClick={() => triggerAdvisorRequest(activeTicker)}
                disabled={reportLoading}
                className="bg-slate-900 hover:bg-slate-800 px-2 py-1 border border-slate-850 rounded-sm font-mono text-[8px] text-emerald-400 flex items-center gap-1 cursor-pointer"
              >
                {reportLoading ? "RESOLVING..." : `REFRESH DATA CORE (${activeTicker})`}
              </button>
            </div>

            {reportError && (
              <div className="p-3.5 bg-rose-950/20 border border-rose-955 rounded-sm text-rose-450 font-mono text-[10px] uppercase">
                <div className="font-black flex items-center gap-1"><AlertTriangle size={12} /> SECRETS DEPLETION ERROR</div>
                <div className="mt-1 leading-normal text-rose-350">{reportError}. Connect your key in settings secrets inside Google AI Studio.</div>
              </div>
            )}

            <AdvisorReport report={currentReport} isLoading={reportLoading} />
          </div>

        </section>

        {/* Operations Sidebar Panel (Right) */}
        <aside className="w-full md:w-80 border-t md:border-t-0 md:border-l border-slate-800 bg-[#0b0b0e] flex flex-col p-4 space-y-4 overflow-y-auto">
          
          {/* Portfolio & Exits component */}
          <SimulatedPortfolio
            positions={positions}
            onPlaceTrade={handlePlaceTrade}
            onExitTrade={handleExitTrade}
            activePrice={activePrice}
            activeTicker={activeTicker}
          />

          {/* Alert limits configurator */}
          <AlertManager
            alerts={alerts}
            onAddAlert={handleAddAlert}
            onRemoveAlert={handleRemoveAlert}
            activePrice={activePrice}
            activeTicker={activeTicker}
          />

          {/* Timeline and system trace event logger */}
          <div className="bg-slate-950 rounded-sm border border-slate-800 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-850 pb-1.5">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest font-mono">
                TELEMETRY EVENT TIMELINE
              </span>
              <span className="text-[8px] font-mono text-emerald-500 animate-pulse font-bold tracking-tight">
                ● MONITOR ONLINE
              </span>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {eventLogs.length === 0 ? (
                <p className="text-[9px] text-slate-600 font-mono uppercase tracking-tight italic py-4 text-center">
                  LISTENING FOR INTERACTION FEED DELTAS...
                </p>
              ) : (
                eventLogs.map((log) => {
                  let color = "text-slate-400 border-slate-850";
                  if (log.type === "BUY") color = "text-emerald-400 border-emerald-900 bg-emerald-950/10";
                  if (log.type === "SELL") color = "text-rose-450 border-rose-900 bg-rose-950/10";
                  if (log.type === "ALERT") color = "text-indigo-400 border-indigo-900 bg-indigo-950/10";

                  return (
                    <div
                      key={log.id}
                      className={`p-1.5 rounded-sm border text-[9px] font-mono leading-normal transition ${color}`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[8px] text-slate-500">{log.time}</span>
                        <span className="text-[8px] font-black bg-slate-900 px-1 rounded-sm border border-slate-850">
                          {log.type}
                        </span>
                      </div>
                      <p className="font-bold leading-tight uppercase">{log.text}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          
        </aside>

      </div>

    </div>
  );
}
