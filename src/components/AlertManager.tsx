import React, { useState } from "react";
import { StockAlert } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { Bell, BellOff, Trash2, Plus, AlertCircle, Sparkles, CheckCircle } from "lucide-react";

interface AlertManagerProps {
  alerts: StockAlert[];
  onAddAlert: (type: "PRICE_ABOVE" | "PRICE_BELOW" | "RSI_OVERSOLD" | "RSI_OVERBOUGHT", value: number) => void;
  onRemoveAlert: (id: string) => void;
  activePrice: number;
  activeTicker: string;
}

export function AlertManager({
  alerts,
  onAddAlert,
  onRemoveAlert,
  activePrice,
  activeTicker,
}: AlertManagerProps) {
  const [alertValue, setAlertValue] = useState<string>("");
  const [alertType, setAlertType] = useState<"PRICE_ABOVE" | "PRICE_BELOW" | "RSI_OVERSOLD" | "RSI_OVERBOUGHT">("PRICE_ABOVE");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(alertValue);
    if (isNaN(val) || val <= 0) return;
    onAddAlert(alertType, val);
    setAlertValue("");
  };

  const currentTickerAlerts = alerts.filter((a) => a.ticker === activeTicker);

  const getAlertFriendlyText = (alert: StockAlert) => {
    switch (alert.type) {
      case "PRICE_ABOVE":
        return `PRICE CLIMBS ABOVE $${alert.value.toFixed(2)}`;
      case "PRICE_BELOW":
        return `PRICE DROPS BELOW $${alert.value.toFixed(2)}`;
      case "RSI_OVERBOUGHT":
        return `RSI CLIMBS OVERBOUGHT APEX ${alert.value}`;
      case "RSI_OVERSOLD":
        return `RSI DROPS OVERSOLD SUPPORT ${alert.value}`;
      default:
        return "TECHNICAL BOUNDARY BREACHED";
    }
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded shadow-sm p-4 flex flex-col justify-between text-slate-300">
      <div>
        <div className="flex items-center justify-between mb-3 border-b border-slate-800/60 pb-2">
          <div className="flex items-center gap-2">
            <Bell className="text-emerald-400" size={14} />
            <span className="text-[10px] font-black text-white uppercase tracking-widest font-mono">
              ALARM TRIGGERS ({activeTicker})
            </span>
          </div>
          <span className="text-[9px] font-mono text-slate-500 uppercase">
            {currentTickerAlerts.length} ASSIGNED
          </span>
        </div>

        {/* Set New Alert Form */}
        <form onSubmit={handleSubmit} className="mb-4 bg-slate-950 p-2.5 rounded-sm border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end">
          <div className="space-y-1">
            <span className="text-[8px] font-mono text-slate-500 uppercase block">ALARM CONDITIONAL</span>
            <select
              value={alertType}
              onChange={(e) => {
                const val = e.target.value as any;
                setAlertType(val);
                if (val === "RSI_OVERSOLD") setAlertValue("30");
                else if (val === "RSI_OVERBOUGHT") setAlertValue("70");
                else setAlertValue("");
              }}
              className="w-full bg-slate-900 text-slate-300 text-[10px] font-mono rounded-sm border border-slate-800 p-1.5 focus:border-slate-650 outline-none"
            >
              <option value="PRICE_ABOVE">PRICE CLIMB ($)</option>
              <option value="PRICE_BELOW">PRICE DROP ($)</option>
              <option value="RSI_OVERBOUGHT">RSI OB (70+)</option>
              <option value="RSI_OVERSOLD">RSI OS (30-)</option>
            </select>
          </div>

          <div className="space-y-1">
            <span className="text-[8px] font-mono text-slate-500 uppercase block">LIMIT VALUE</span>
            <input
              type="number"
              step="any"
              value={alertValue}
              onChange={(e) => setAlertValue(e.target.value)}
              className="w-full bg-slate-900 text-white rounded-sm border border-slate-800 p-1.5 font-mono text-[10px] focus:border-slate-650 outline-none"
              placeholder={alertType.startsWith("RSI") ? "30" : activePrice.toFixed(0)}
              required
            />
          </div>

          <button
            type="submit"
            className="bg-[#09090b] hover:bg-slate-900 text-emerald-400 font-mono font-bold text-[9px] py-2 rounded-sm border border-emerald-950/60 uppercase tracking-widest transition duration-150 w-full flex items-center justify-center gap-1 cursor-pointer"
          >
            <Plus size={11} className="stroke-[2.5]" />
            <span>CREATE</span>
          </button>
        </form>

        {/* Active Alerts List */}
        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
          {currentTickerAlerts.length === 0 ? (
            <div className="py-6 text-center text-slate-550 border border-dashed border-slate-850 rounded-sm">
              <BellOff className="mx-auto text-slate-700 mb-1.5" size={18} />
              <p className="text-[9px] uppercase font-mono tracking-wider">NO ALARMS CONFIGURED</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {currentTickerAlerts.map((alert) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`p-2 rounded-sm border text-[10px] font-mono flex justify-between items-center transition ${alert.isTriggered ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-300" : "bg-slate-950/40 border-slate-850/80 text-slate-400"}`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    {alert.isTriggered ? (
                      <CheckCircle size={11} className="text-emerald-400 flex-shrink-0 animate-bounce" />
                    ) : (
                      <AlertCircle size={11} className="text-slate-500 flex-shrink-0" />
                    )}
                    <div className="space-y-0.5 min-w-0">
                      <span className="font-bold block truncate">{getAlertFriendlyText(alert)}</span>
                      {alert.isTriggered && (
                        <span className="text-[8px] text-emerald-500 uppercase tracking-tight block">
                          TRIGGER BOUNDARY PENETRATED!
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => onRemoveAlert(alert.id)}
                    className="text-slate-600 hover:text-rose-450 p-1 rounded-sm hover:bg-slate-900/50 transition flex-shrink-0 cursor-pointer"
                  >
                    <Trash2 size={11} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-800/40 flex items-center gap-1.5 text-[8px] text-slate-500 font-mono uppercase tracking-tight">
        <Sparkles size={10} className="text-indigo-400" />
        <span>Sim continuous watchdog monitor active</span>
      </div>
    </div>
  );
}
