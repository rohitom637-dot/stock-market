import React from "react";
import { StockReport } from "../types";
import { motion } from "motion/react";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Compass,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  ExternalLink,
} from "lucide-react";

interface AdvisorReportProps {
  report: StockReport | null;
  isLoading: boolean;
}

export function AdvisorReport({ report, isLoading }: AdvisorReportProps) {
  if (isLoading) {
    return (
      <div className="p-6 bg-slate-900/40 border border-slate-800 rounded shadow-sm flex flex-col items-center justify-center min-h-[300px]">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-12 h-12 rounded-full border border-emerald-500/10 animate-pulse" />
          <div className="w-10 h-10 rounded-full border-t border-b border-emerald-500 animate-spin" />
          <Sparkles className="absolute text-emerald-400 animate-bounce" size={14} />
        </div>
        <h4 className="text-white font-mono text-xs uppercase tracking-widest mt-4">
          RESOLVING ANALYTICS ENGINE...
        </h4>
        <p className="text-[10px] text-slate-500 text-center max-w-xs mt-1.5 font-mono">
          QUERYING LIVE SEARCH INDEXES FOR NEW FUNDAMENTAL TRIGGER PATHS
        </p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-6 bg-slate-900/40 border border-dashed border-slate-800 rounded shadow-sm flex flex-col items-center justify-center min-h-[300px]">
        <Compass className="text-slate-600 mb-3 animate-spin-slow" size={32} />
        <h4 className="text-slate-400 font-mono text-xs uppercase tracking-wider">
          ADVISOR CONSOLE INACTIVE
        </h4>
        <p className="text-[10px] text-slate-500 text-center max-w-xs mt-1 font-mono uppercase">
          Select asset and trigger adviser query to ingest research summaries
        </p>
      </div>
    );
  }

  const getRecommendationBadge = (rec: string) => {
    switch (rec) {
      case "STRONG_BUY":
        return {
          bg: "bg-emerald-950/40 text-emerald-400 border border-emerald-500/40",
          text: "STRONG BUY SIGNAL",
          color: "text-emerald-500",
        };
      case "BUY":
        return {
          bg: "bg-emerald-950/20 text-emerald-400 border border-emerald-500/20",
          text: "BUY RECOMMENDATION",
          color: "text-emerald-500",
        };
      case "HOLD":
        return {
          bg: "bg-amber-950/20 text-amber-400 border border-amber-500/20",
          text: "HOLD POSITION STABLE",
          color: "text-amber-500",
        };
      case "SELL":
        return {
          bg: "bg-rose-950/20 text-rose-400 border border-rose-500/20",
          text: "SELL ADVISORY ACTIVE",
          color: "text-rose-500",
        };
      case "STRONG_SELL":
        return {
          bg: "bg-rose-950/40 text-rose-400 border border-rose-500/40",
          text: "STRONG SELL ALERT",
          color: "text-rose-500",
        };
      default:
        return {
          bg: "bg-slate-900 text-slate-400 border border-slate-800",
          text: "UNRATED",
          color: "text-slate-500",
        };
    }
  };

  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case "BULLISH":
        return "bg-emerald-950/50 text-emerald-400 border border-emerald-850 text-[9px] px-1.5 py-0.5 rounded-sm font-mono font-bold";
      case "BEARISH":
        return "bg-rose-950/50 text-rose-400 border border-rose-850 text-[9px] px-1.5 py-0.5 rounded-sm font-mono font-bold";
      default:
        return "bg-slate-950 text-slate-400 border border-slate-800 text-[9px] px-1.5 py-0.5 rounded-sm font-mono font-bold";
    }
  };

  const recBadge = getRecommendationBadge(report.recommendation);
  const isPositive = report.changeAmount >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4 text-slate-300"
    >
      {/* 1. Header Metadata Section */}
      <div className="p-4 bg-slate-900/40 border border-slate-800 rounded shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black text-white font-mono tracking-widest">
                {report.ticker}
              </span>
              <span className={`px-2 py-0.5 font-mono text-[9px] font-bold rounded-sm ${recBadge.bg}`}>
                {recBadge.text}
              </span>
            </div>
            <h2 className="text-xs font-bold text-slate-450 mt-1 uppercase tracking-wider font-mono">{report.companyName}</h2>
          </div>

          <div className="flex items-start md:items-end flex-col">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-white font-mono tracking-tight">
                ${report.currentPrice.toFixed(2)}
              </span>
              <span className="text-[9px] text-slate-500 font-mono uppercase">USD</span>
            </div>
            <div className={`flex items-center gap-1 text-xs font-bold font-mono ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
              {isPositive ? <TrendingUp size={12} className="stroke-[2.5]" /> : <TrendingDown size={12} className="stroke-[2.5]" />}
              <span>
                {isPositive ? "+" : ""}
                {report.changeAmount.toFixed(2)} ({isPositive ? "+" : ""}
                {report.changePercent.toFixed(2)}%)
              </span>
              <span className="text-[9px] text-slate-500 font-mono font-normal uppercase tracking-tight">/ CURRENT</span>
            </div>
          </div>
        </div>

        {/* Extended Stats Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-slate-800/60">
          <div className="bg-slate-950/40 p-2 border border-slate-800 rounded-sm">
            <span className="text-[9px] font-mono text-slate-500 uppercase block tracking-wider">DAILY INTERVAL</span>
            <span className="text-[11px] font-mono font-bold text-white mt-0.5 block">
              ${report.dailyLow.toFixed(2)} - ${report.dailyHigh.toFixed(2)}
            </span>
          </div>
          <div className="bg-slate-950/40 p-2 border border-slate-800 rounded-sm">
            <span className="text-[9px] font-mono text-slate-500 uppercase block tracking-wider">MARKET VALUE</span>
            <span className="text-[11px] font-mono font-bold text-white mt-0.5 block">{report.marketCap}</span>
          </div>
          <div className="bg-slate-950/40 p-2 border border-slate-800 rounded-sm">
            <span className="text-[9px] font-mono text-slate-500 uppercase block tracking-wider">52-WEEK FLOOR</span>
            <span className="text-[11px] font-mono font-bold text-slate-300 mt-0.5 block">${report.range52WeekLow.toFixed(2)}</span>
          </div>
          <div className="bg-slate-950/40 p-2 border border-slate-800 rounded-sm">
            <span className="text-[9px] font-mono text-slate-500 uppercase block tracking-wider">52-WEEK PEAK</span>
            <span className="text-[11px] font-mono font-bold text-slate-300 mt-0.5 block">${report.range52WeekHigh.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* 2. Visual Recommendation Gauge & Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-900/40 border border-slate-800 rounded shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-[10px] font-black text-slate-400 tracking-wider uppercase font-mono">
              SUGGESTED ACTION SCORE
            </h3>
            <p className="text-[9px] text-slate-500 font-mono uppercase mt-0.5 leading-snug">STRENGTH RATIO COMPUTED BY ADVISOR MATRIX</p>
          </div>

          <div className="flex flex-col items-center justify-center py-4 relative">
            {/* Round Gauge Circle */}
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" stroke="#1f2937" strokeWidth="6" fill="transparent" />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke={
                    report.recommendationScore >= 70
                      ? "#10b981"
                      : report.recommendationScore >= 40
                      ? "#f59e0b"
                      : "#f43f5e"
                  }
                  strokeWidth="6"
                  fill="transparent"
                  strokeDasharray="264"
                  strokeDashoffset={264 - (264 * report.recommendationScore) / 100}
                  strokeLinecap="square"
                />
              </svg>
              <div className="text-center z-10">
                <span className="text-3xl font-black text-white font-mono leading-none block">
                  {report.recommendationScore}
                </span>
                <span className="text-[8px] text-slate-500 font-mono tracking-widest uppercase block mt-0.5">SCORE</span>
              </div>
            </div>
          </div>

          <div className="text-center border-t border-slate-800/40 pt-2">
            <span className="text-[9px] font-mono text-slate-500 uppercase">
              STRATEGIC CONFIDENCE RATIO LIMIT
            </span>
          </div>
        </div>

        {/* Core Narrative Advisor Summary */}
        <div className="md:col-span-2 p-4 bg-slate-900/40 border border-slate-800 rounded shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold uppercase tracking-wider mb-2 font-mono">
              <Sparkles size={11} />
              <span>DECISION GROUNDING COMMENTARY</span>
            </div>
            <p className="text-xs text-slate-350 leading-relaxed font-sans">{report.summary}</p>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-800/40">
            <h4 className="text-[9px] font-bold text-slate-550 font-mono mb-2 uppercase tracking-wide">
              IMMEDIATE FUNDAMENTAL CATALYSTS IN VIEW
            </h4>
            <ul className="space-y-1.5">
              {report.catalysts.map((catalyst, idx) => (
                <li key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-300 leading-normal">
                  <span className="w-1.5 h-1.5 rounded-sm bg-emerald-500 mt-1 flex-shrink-0" />
                  <span>{catalyst}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 3. Action Warnings and Strategies: "When to invest" vs "When to take returns" */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Entry: When to Invest */}
        <div className="p-4 bg-slate-900/40 border border-emerald-950 rounded shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="bg-emerald-950/50 p-1.5 rounded-sm text-emerald-400 border border-emerald-900/30">
                  <ArrowDownLeft size={14} className="stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-wider font-mono">
                    STRATEGY: ENTERING LIMITS
                  </h3>
                  <p className="text-[9px] text-slate-500 font-mono">ENTRY GUIDELINES AND TRIGGER LEVELS</p>
                </div>
              </div>
            </div>

            <div className="bg-emerald-950/20 p-2.5 rounded-sm border border-emerald-900/30 mb-3">
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-[9px] text-emerald-400/80 font-mono uppercase">BUY TARGET LIMIT:</span>
                <span className="text-lg font-black text-white font-mono">
                  ${report.whenToBuy.priceIndicator.toFixed(2)}
                </span>
              </div>
              <div className="text-[10px] text-emerald-300 font-mono leading-tight flex items-center gap-1.5">
                <span className="text-emerald-500 font-bold uppercase bg-emerald-900/30 px-1 py-0.5 rounded-sm text-[8px] tracking-tight flex-shrink-0">INDICATOR:</span>
                <span className="truncate">{report.whenToBuy.technicalTrigger}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              {report.whenToBuy.description}
            </p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800/40 flex items-center gap-1.5 text-[8px] text-slate-500 font-mono uppercase">
            <span>● SUGGESTED ACTION: ACCUMULATE BELOW TARGET THRESHOLD</span>
          </div>
        </div>

        {/* Exit: When to Take Money Out */}
        <div className="p-4 bg-slate-900/40 border border-rose-950 rounded shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="bg-rose-950/50 p-1.5 rounded-sm text-rose-450 border border-rose-900/30">
                  <ArrowUpRight size={14} className="stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-[10px] font-black text-rose-400 uppercase tracking-wider font-mono">
                    STRATEGY: LIQUIDATION LIMITS
                  </h3>
                  <p className="text-[9px] text-slate-500 font-mono">MITIGATE VOLATILITY RISK</p>
                </div>
              </div>
            </div>

            <div className="bg-rose-950/15 p-2.5 rounded-sm border border-rose-900/30 mb-3 space-y-1.5">
              <div className="flex items-baseline justify-between">
                <span className="text-[9px] text-rose-400/80 font-mono uppercase">TAKE PROFIT TARGET:</span>
                <span className="text-lg font-black text-white font-mono">
                  ${report.whenToSell.priceIndicator.toFixed(2)}
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-1 border-t border-rose-950/30">
                <span className="text-[9px] text-slate-500 font-mono uppercase">STOP LOSS FLOOR:</span>
                <span className="text-xs font-black text-rose-400/90 font-mono">
                  ${report.whenToSell.stopLoss.toFixed(2)}
                </span>
              </div>
              <div className="text-[10px] text-rose-300 font-mono leading-tight flex items-center gap-1.5 pt-0.5">
                <span className="text-rose-500 font-bold uppercase bg-rose-905/30 px-1 py-0.5 rounded-sm text-[8px] tracking-tight flex-shrink-0">TRIGGER:</span>
                <span className="truncate">{report.whenToSell.technicalTrigger}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              {report.whenToSell.description}
            </p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800/40 flex items-center gap-1.5 text-[8px] text-slate-500 font-mono uppercase">
            <span>● ADVISORY NOTE: TIGHT STOPS GUARD INVESTMENT BASIS</span>
          </div>
        </div>
      </div>

      {/* 4. Real-world Grounding Cited Articles */}
      {report.newsSources && report.newsSources.length > 0 && (
        <div className="p-4 bg-slate-900/40 border border-slate-800 rounded shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase font-mono">
              VERIFIED NEWS & FUNDAMENTAL SIGNAL CITATIONS
            </span>
            <span className="text-[8px] font-mono bg-slate-950 text-slate-400 px-1.5 py-0.5 rounded-sm border border-slate-800 uppercase tracking-widest">
              Live Verified
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {report.newsSources.map((news, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-950/50 rounded border border-slate-800/80 hover:bg-slate-950 transition flex flex-col justify-between h-full gap-2.5"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className={getSentimentBadge(news.sentiment)}>{news.sentiment}</span>
                    <span className="text-[8px] text-slate-500 font-mono">INDEX #{idx + 1}</span>
                  </div>
                  <h4 className="text-[11px] font-semibold text-slate-200 line-clamp-2 leading-relaxed">
                    {news.title}
                  </h4>
                </div>

                {news.url ? (
                  <a
                    href={news.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[8px] font-mono uppercase text-emerald-400 hover:text-emerald-300 cursor-pointer mt-1"
                  >
                    <span>EXPLORE SOURCE ARTICLE</span>
                    <ExternalLink size={8} />
                  </a>
                ) : (
                  <span className="text-[8px] font-mono text-slate-650 mt-1 uppercase">CITED REFERENCED INDEX</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
