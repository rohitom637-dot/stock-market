import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import { ChartTick, SimulatedPosition } from "../types";
import { motion } from "motion/react";
import { TrendingUp, TrendingDown, Eye, HelpCircle } from "lucide-react";

interface StockChartProps {
  ticks: ChartTick[];
  ticker: string;
  positions: SimulatedPosition[];
  showIndicators: boolean;
}

export function StockChart({ ticks, ticker, positions, showIndicators }: StockChartProps) {
  if (ticks.length === 0) {
    return (
      <div className="h-64 flex flex-col justify-center items-center text-slate-400 bg-slate-950 rounded border border-slate-800">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-3" />
        <p className="text-xs font-mono uppercase tracking-widest">Seeding real-time feeds...</p>
      </div>
    );
  }

  const latestTick = ticks[ticks.length - 1];

  // Align positions to display on the chart
  const relevantPositions = positions.filter((pos) => pos.ticker === ticker);

  // Custom data source combining ticks and trades for charting
  const chartData = ticks.map((tick) => {
    const trades = relevantPositions.filter((pos) => {
      const diff = Math.abs(pos.timestamp - tick.timestamp);
      return diff < 1500; // within 1.5 seconds of the tick
    });

    const buyTrade = trades.find((t) => t.type === "BUY" && t.isActive);
    const sellTrade = trades.find((t) => !t.isActive || t.type === "SELL");

    return {
      ...tick,
      buyMarker: buyTrade ? buyTrade.buyPrice : null,
      sellMarker: sellTrade ? (sellTrade.exitPrice || latestTick.price) : null,
    };
  });

  // Calculate dynamic green/red trend for the primary line
  const priceChange = chartData.length >= 2 ? chartData[chartData.length - 1].price - chartData[0].price : 0;
  const isUp = priceChange >= 0;
  const trendColor = isUp ? "#10b981" : "#f43f5e";
  const gradientId = isUp ? "colorPriceUp" : "colorPriceDown";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-4 bg-slate-900/40 border border-slate-800 rounded shadow-sm text-slate-300"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3 border-b border-slate-800/60 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-white font-mono tracking-widest uppercase">
              REAL-TIME ANALYTICAL GRID : {ticker}
            </span>
            <span className="flex h-1.5 w-1.5 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isUp ? "bg-emerald-400" : "bg-rose-400"}`}></span>
              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isUp ? "bg-emerald-500" : "bg-rose-500"}`}></span>
            </span>
          </div>
          <p className="text-[10px] text-slate-500 uppercase mt-0.5 tracking-tight">
            TICK FEED UPDATING SEC-BY-SEC • OVERLAY METRICS ACTIVE
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono">
          <div className="flex items-center gap-1.5 text-slate-200">
            <span className={`w-2 h-2 rounded-sm inline-block`} style={{ backgroundColor: trendColor }} />
            <span>PRICE</span>
          </div>
          {showIndicators && (
            <>
              <div className="flex items-center gap-1 text-amber-500">
                <span className="w-2 h-0.5 border-t border-amber-500 inline-block" />
                <span>FAST SMA</span>
              </div>
              <div className="flex items-center gap-1 text-teal-400">
                <span className="w-2 h-0.5 border-t border-teal-400 inline-block" />
                <span>SLOW SMA</span>
              </div>
            </>
          )}
          <div className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>BUY ORDER</span>
          </div>
          <div className="flex items-center gap-1 text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
            <span>SELL ORDER</span>
          </div>
        </div>
      </div>

      {/* Main Stock Price Chart */}
      <div className="h-60 w-full mt-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPriceUp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorPriceDown" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" opacity={0.4} />
            <XAxis dataKey="time" stroke="#475569" fontSize={9} fontClassName="font-mono" minTickGap={50} />
            <YAxis
              stroke="#475569"
              fontSize={9}
              fontClassName="font-mono"
              domain={["auto", "auto"]}
              tickFormatter={(v) => `$${v.toFixed(2)}`}
            />
            <Tooltip
              contentStyle={{ background: "#09090b", border: "1px solid #1e293b", borderRadius: "2px", pointerEvents: "none" }}
              labelStyle={{ color: "#64748b", fontFamily: "monospace", fontSize: "9px" }}
              itemStyle={{ fontFamily: "monospace", fontSize: "10px", padding: "1px 0" }}
              formatter={(value: any, name: string) => {
                if (name === "price") return [`$${value.toFixed(2)}`, "PRICE"];
                if (name === "smaFast") return [`$${value.toFixed(2)}`, "F-SMA"];
                if (name === "smaSlow") return [`$${value.toFixed(2)}`, "S-SMA"];
                if (name === "buyMarker") return [`$${value.toFixed(2)}`, "BUY EXEC"];
                if (name === "sellMarker") return [`$${value.toFixed(2)}`, "SELL EXEC"];
                return [value, name];
              }}
            />
            <Area type="monotone" dataKey="price" stroke={trendColor} strokeWidth={2} fillOpacity={1} fill={`url(#${gradientId})`} />
            
            {showIndicators && (
              <>
                <Line
                  type="monotone"
                  dataKey="smaFast"
                  stroke="#f59e0b"
                  strokeWidth={1}
                  dot={false}
                  strokeDasharray="3 3"
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="smaSlow"
                  stroke="#14b8a6"
                  strokeWidth={1}
                  dot={false}
                  strokeDasharray="3 3"
                  connectNulls
                />
              </>
            )}

            {/* Custom Interactive Markers */}
            <Line
              type="monotone"
              dataKey="buyMarker"
              stroke="transparent"
              dot={{ stroke: "#10b981", strokeWidth: 2, r: 4, fill: "#000000" }}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="sellMarker"
              stroke="transparent"
              dot={{ stroke: "#f43f5e", strokeWidth: 2, r: 4, fill: "#000000" }}
              connectNulls
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* RSI (Relative Strength Index) Indicator Sub-panel */}
      {showIndicators && (
        <div className="mt-3 border-t border-slate-800/60 pt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-slate-500 font-mono uppercase tracking-wider">
              RSI (14) OSCILLATOR PROFILE
            </span>
            <div className="flex gap-2 text-[8px] font-mono uppercase text-slate-500">
              <span className="text-rose-500">OB &gt;= 70 (SELL)</span>
              <span className="text-emerald-500">OS &lt;= 30 (BUY)</span>
            </div>
          </div>
          <div className="h-14 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 2, right: 5, left: -25, bottom: 2 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" opacity={0.3} />
                <XAxis dataKey="time" hide />
                <YAxis stroke="#475569" fontSize={8} fontClassName="font-mono" domain={[0, 100]} ticks={[30, 50, 70]} />
                <Tooltip
                  contentStyle={{ background: "#09090b", border: "1px solid #1e293b", borderRadius: "2px" }}
                  labelStyle={{ display: "none" }}
                  itemStyle={{ fontFamily: "monospace", fontSize: "10px", color: "#a855f7" }}
                  formatter={(value: any) => [parseFloat(value).toFixed(1), "RSI"]}
                />
                <ReferenceLine y={70} stroke="#f43f5e" strokeWidth={0.75} strokeDasharray="2 2" label={{ value: "OB 70", fill: "#f43f5e", fontSize: 7, position: "left", fontFamily: "monospace" }} />
                <ReferenceLine y={30} stroke="#10b981" strokeWidth={0.75} strokeDasharray="2 2" label={{ value: "OS 30", fill: "#10b981", fontSize: 7, position: "left", fontFamily: "monospace" }} />
                <ReferenceLine y={50} stroke="#4b5563" strokeWidth={0.5} strokeDasharray="2 2" />
                <Line
                  type="monotone"
                  dataKey="rsi"
                  stroke="#a855f7"
                  strokeWidth={1}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </motion.div>
  );
}
