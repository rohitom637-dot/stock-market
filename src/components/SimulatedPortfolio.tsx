import React, { useState } from "react";
import { SimulatedPosition } from "../types";
import { motion, AnimatePresence } from "motion/react";
import {
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Briefcase,
  History,
  AlertCircle,
} from "lucide-react";

interface SimulatedPortfolioProps {
  positions: SimulatedPosition[];
  onPlaceTrade: (type: "BUY" | "SELL", shares: number, stopLoss?: number, takeProfit?: number) => void;
  onExitTrade: (id: string, currentPrice: number) => void;
  activePrice: number;
  activeTicker: string;
}

export function SimulatedPortfolio({
  positions,
  onPlaceTrade,
  onExitTrade,
  activePrice,
  activeTicker,
}: SimulatedPortfolioProps) {
  const [sharesInput, setSharesInput] = useState<number>(10);
  const [stopLossInput, setStopLossInput] = useState<string>("");
  const [takeProfitInput, setTakeProfitInput] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"trading" | "holdings" | "history">("trading");

  // Calculate stats
  const activeHoldings = positions.filter((p) => p.isActive);
  const historyHoldings = positions.filter((p) => !p.isActive);

  // Initial dummy cache: $100,000
  let initialBalance = 100000;
  
  // Balance calculation matches App.tsx perfectly
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

  const handleBuy = (e: React.FormEvent) => {
    e.preventDefault();
    if (sharesInput <= 0) return;
    const sl = stopLossInput ? parseFloat(stopLossInput) : undefined;
    const tp = takeProfitInput ? parseFloat(takeProfitInput) : undefined;
    onPlaceTrade("BUY", sharesInput, sl, tp);
    setStopLossInput("");
    setTakeProfitInput("");
  };

  const handleShortcutPercent = (percent: number, direction: "UP" | "DOWN") => {
    if (direction === "UP") {
      setTakeProfitInput((activePrice * (1 + percent / 100)).toFixed(2));
    } else {
      setStopLossInput((activePrice * (1 - percent / 100)).toFixed(2));
    }
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded shadow-sm overflow-hidden flex flex-col text-slate-300">
      
      {/* Portfolio Quick Overview HUD Banner */}
      <div className="bg-slate-950/60 p-4 border-b border-slate-800">
        <div className="flex items-center gap-2 mb-3">
          <Briefcase className="text-emerald-400" size={14} />
          <h3 className="text-[10px] font-black text-white uppercase tracking-widest font-mono">
            PORTFOLIO LEDGER SYSTEM
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-950/50 p-2 border border-slate-800/80 rounded-sm">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">ACCOUNT EQUITY</span>
            <p className="text-sm font-black text-white font-mono mt-0.5">
              ${totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-slate-950/50 p-2 border border-slate-800/80 rounded-sm">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">UNSPENT MARGIN</span>
            <p className="text-sm font-bold text-slate-300 font-mono mt-0.5">
              ${currentCash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-slate-950/50 p-2 border border-slate-800/80 rounded-sm">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">ACTIVE CAPITAL</span>
            <p className="text-xs font-bold text-slate-300 font-mono mt-0.5">
              ${totalActiveCapital.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-slate-950/50 p-2 border border-slate-800/80 rounded-sm">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">REALIZED GAINS</span>
            <div className={`flex items-center gap-0.5 text-xs font-bold font-mono mt-0.5 ${netProfit >= 0 ? "text-emerald-400" : "text-rose-450"}`}>
              <span>{netProfit >= 0 ? "+" : ""}</span>
              <span className="truncate">
                {totalProfitPercent.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex bg-slate-950/20 border-b border-slate-800/60 p-1 gap-1 text-[9px] font-bold font-mono uppercase tracking-wider">
        <button
          onClick={() => setActiveTab("trading")}
          className={`flex-1 py-1.5 rounded-sm transition duration-150 cursor-pointer text-center ${activeTab === "trading" ? "bg-slate-800 border border-slate-700 text-emerald-400 font-black" : "text-slate-500 hover:text-slate-300"}`}
        >
          <span className="inline-flex items-center gap-1">
            <ShoppingBag size={11} />
            <span>TRADE ({activeTicker})</span>
          </span>
        </button>
        <button
          onClick={() => setActiveTab("holdings")}
          className={`flex-1 py-1.5 rounded-sm transition duration-150 relative cursor-pointer text-center ${activeTab === "holdings" ? "bg-slate-800 border border-slate-700 text-emerald-400 font-black" : "text-slate-500 hover:text-slate-300"}`}
        >
          <span className="inline-flex items-center gap-1 justify-center">
            <Briefcase size={11} />
            <span>HOLDINGS</span>
            {activeHoldings.length > 0 && (
              <span className="ml-1 bg-emerald-500 text-black text-[8px] font-black px-1 rounded-sm">
                {activeHoldings.length}
              </span>
            )}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 py-1.5 rounded-sm transition duration-150 cursor-pointer text-center ${activeTab === "history" ? "bg-slate-800 border border-slate-700 text-emerald-400 font-black" : "text-slate-500 hover:text-slate-300"}`}
        >
          <span className="inline-flex items-center gap-1">
            <History size={11} />
            <span>RETURNS</span>
          </span>
        </button>
      </div>

      {/* Tabs content */}
      <div className="p-4 flex-1">
        <AnimatePresence mode="wait">
          {activeTab === "trading" && (
            <motion.form
              key="trading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleBuy}
              className="space-y-3"
            >
              <div>
                <label className="text-[9px] font-mono text-slate-500 uppercase block mb-1">
                  ORDER ASSET TARGET
                </label>
                <div className="bg-slate-950 border border-slate-850 px-2.5 py-1.5 rounded-sm text-xs font-bold text-emerald-400 font-mono flex justify-between items-center">
                  <span>{activeTicker}/USD</span>
                  <span className="text-white">${activePrice.toFixed(2)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-mono text-slate-500 uppercase block mb-1">
                    SHARES VOLUME
                  </label>
                  <input
                    type="number"
                    value={sharesInput}
                    onChange={(e) => setSharesInput(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full bg-slate-950 text-white rounded-sm border border-slate-800 p-2 font-mono text-xs focus:border-slate-650 outline-none"
                    placeholder="10"
                    min="1"
                    required
                  />
                  <div className="flex gap-1 mt-1 font-mono">
                    {[5, 10, 50, 100].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setSharesInput(val)}
                        className="text-[8px] font-bold bg-slate-950 text-slate-400 px-1 py-0.5 rounded-sm hover:bg-slate-800 border border-slate-850"
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-mono text-slate-500 uppercase block mb-1">
                    ESTIMATED VALUE
                  </label>
                  <div className="bg-slate-900/80 border border-slate-850 px-2.5 py-2 rounded-sm text-xs font-bold text-slate-350 font-mono">
                    ${(activePrice * sharesInput).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Automatic take profits / stop loss triggers */}
              <div className="border-t border-slate-800/80 pt-3 space-y-2">
                <div className="flex items-center gap-1">
                  <AlertCircle size={12} className="text-emerald-400" />
                  <span className="text-[9px] font-black uppercase text-slate-400 font-mono tracking-wider">RISK PREVENTERS / AUTOMATED EXITS</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[8px] font-mono text-slate-500 uppercase block mb-0.5">
                      TAKE PROFIT (USD LIMIT)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={takeProfitInput}
                      onChange={(e) => setTakeProfitInput(e.target.value)}
                      className="w-full bg-slate-950 text-white rounded-sm border border-slate-800 p-1.5 font-mono text-[11px] focus:border-slate-650 outline-none"
                      placeholder="E.g., 210.00"
                    />
                    <div className="flex gap-1 mt-1 text-[8px] font-mono text-slate-500 items-center">
                      <span>QUICK:</span>
                      {[5, 10, 15].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => handleShortcutPercent(p, "UP")}
                          className="hover:text-emerald-400 underline px-0.5 cursor-pointer"
                        >
                          +{p}%
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[8px] font-mono text-slate-500 uppercase block mb-0.5">
                      STOP LOSS (USD LIMIT)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={stopLossInput}
                      onChange={(e) => setStopLossInput(e.target.value)}
                      className="w-full bg-slate-950 text-white rounded-sm border border-slate-800 p-1.5 font-mono text-[11px] focus:border-slate-650 outline-none"
                      placeholder="E.g., 175.00"
                    />
                    <div className="flex gap-1 mt-1 text-[8px] font-mono text-slate-500 items-center">
                      <span>QUICK:</span>
                      {[2, 5, 8].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => handleShortcutPercent(p, "DOWN")}
                          className="hover:text-rose-450 underline px-0.5 cursor-pointer"
                        >
                          -{p}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={currentCash < activePrice * sharesInput}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-950 disabled:border-slate-850 disabled:text-slate-600 text-black font-mono text-[10px] font-bold py-2 px-3 rounded-sm shadow border border-emerald-500 tracking-widest uppercase transition duration-150 cursor-pointer"
                >
                  {currentCash < activePrice * sharesInput
                    ? "MARGIN LIMIT EXCEEDED"
                    : `EXECUTE SIM ORDER (BUY)`}
                </button>
              </div>
            </motion.form>
          )}

          {activeTab === "holdings" && (
            <motion.div
              key="holdings"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1"
            >
              {activeHoldings.length === 0 ? (
                <div className="p-6 text-center text-slate-500 bg-slate-950/20 border border-dashed border-slate-800 rounded-sm">
                  <p className="text-[10px] font-mono uppercase tracking-wider">NO OPEN POSITIONS</p>
                  <p className="text-[8px] text-slate-600 mt-1 uppercase leading-normal font-mono">
                    Submit order inside active ticker target to populate ledger
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeHoldings.map((pos) => {
                    const tickerPrice = pos.ticker === activeTicker ? activePrice : pos.buyPrice;
                    const worth = tickerPrice * pos.shares;
                    const cost = pos.buyPrice * pos.shares;
                    const gain = worth - cost;
                    const gainPercent = (gain / cost) * 100;

                    return (
                      <div
                        key={pos.id}
                        className="bg-slate-950 p-2.5 border border-slate-800 hover:bg-slate-900 transition rounded-sm flex flex-col gap-2"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-white font-mono">{pos.ticker}</span>
                            <span className="text-[8px] bg-slate-800 text-slate-350 border border-slate-700 px-1 py-0.5 rounded-sm font-mono">
                              {pos.shares} S
                            </span>
                          </div>
                          <span className={`text-[10px] font-mono font-bold ${gain >= 0 ? "text-emerald-400" : "text-rose-450"}`}>
                            {gain >= 0 ? "+" : ""}{gainPercent.toFixed(1)}%
                          </span>
                        </div>

                        <div className="flex justify-between items-end border-t border-slate-800/40 pt-2 text-[10px] font-mono">
                          <div className="text-slate-500 space-y-0.5">
                            <div>IN: ${pos.buyPrice.toFixed(2)}</div>
                            <div>CUR: ${tickerPrice.toFixed(2)}</div>
                            {(pos.stopLoss || pos.takeProfit) && (
                              <div className="flex gap-1.5 text-[8px]">
                                {pos.takeProfit && <span className="text-emerald-500">TP: ${pos.takeProfit.toFixed(0)}</span>}
                                {pos.stopLoss && <span className="text-rose-400">SL: ${pos.stopLoss.toFixed(0)}</span>}
                              </div>
                            )}
                          </div>

                          <div className="text-right flex flex-col gap-2 items-end">
                            <div>
                              <div className="text-[8px] text-slate-600">CAPITAL VALUE</div>
                              <div className="text-white font-bold">${worth.toFixed(2)}</div>
                            </div>

                            <button
                              onClick={() => onExitTrade(pos.id, tickerPrice)}
                              className="bg-[#09090b] hover:bg-rose-950/20 text-rose-400 hover:text-rose-300 font-mono font-bold text-[8px] px-2 py-1 rounded-sm border border-rose-900/60 uppercase cursor-pointer transition"
                            >
                              CLAIM (SELL)
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "history" && (
            <motion.div
              key="history"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-2 max-h-[300px] overflow-y-auto pr-1"
            >
              {historyHoldings.length === 0 ? (
                <div className="p-6 text-center text-slate-500 bg-slate-950/20 border border-dashed border-slate-800 rounded-sm">
                  <p className="text-[10px] font-mono uppercase tracking-wider">NO REALIZED LEDGER DATA</p>
                  <p className="text-[8px] text-slate-600 mt-1 uppercase leading-normal font-mono">
                    Returns history logs here after open positions are liquidated
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {historyHoldings.map((pos) => {
                    const isProfitable = (pos.profitOrLoss || 0) >= 0;
                    return (
                      <div
                        key={pos.id}
                        className="bg-slate-950/50 p-2.5 rounded-sm border border-slate-850 hover:bg-slate-950 transition flex items-center justify-between text-[11px] font-mono"
                      >
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="font-extrabold text-white">{pos.ticker}</span>
                            <span className="text-[8px] bg-slate-900 text-slate-450 px-1 py-0.5 rounded-sm">
                              {pos.shares} S
                            </span>
                          </div>
                          <div className="text-[9px] text-slate-500 mt-0.5">
                            ${pos.buyPrice.toFixed(1)} → ${pos.exitPrice?.toFixed(1)}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`font-bold ${isProfitable ? "text-emerald-400" : "text-rose-450"}`}>
                            {isProfitable ? "+" : ""}{(pos.profitOrLoss || 0).toFixed(2)}
                          </span>
                          <span className="text-[8px] text-slate-500 block">{(pos.profitPercent || 0) >= 0 ? "+" : ""}{(pos.profitPercent || 0).toFixed(1)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
