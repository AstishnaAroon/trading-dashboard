"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { supabase } from "../lib/supabaseClient";

interface Strategy {
  id: string;
  user_id: string;
  name: string;
  description: string;
  style: string;
  timeframe: string;
  rules: string[];
}

interface Trade {
  strategy_id: string | null;
  pl: number;
  outcome: string;
}

export default function StrategyLibrary() {
  const { user } = useUser();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Fetch strategies & trades from database
  // Fetch strategies & trades from database, filtering out backtests for live performance stats [1]
  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    setErrorMsg("");

    try {
      // 1. Fetch available strategies (system defaults + user custom ones)
      const { data: stratData, error: stratError } = await supabase
        .from("strategies")
        .select("*")
        .order("created_at", { ascending: true });

      // 2. Fetch user's logged trades to calculate strategy performance (excluding backtests) [1]
      const { data: tradeData, error: tradeError } = await supabase
        .from("trades")
        .select("strategy_id, pl, outcome")
        .eq("user_id", user.id)
        .eq("is_backtest", false); // CRUCIAL: Only calculate live stats [1]

      if (stratError) throw stratError;
      if (tradeError) throw tradeError;

      setStrategies(stratData || []);
      setTrades(tradeData || []);
    } catch (err: any) {
      console.error("Error loading strategies data:", err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Helper function to calculate real-time stats for a specific strategy
  const getStrategyStats = (stratId: string) => {
    const stratTrades = trades.filter((t) => t.strategy_id === stratId);
    const totalTrades = stratTrades.length;

    // Calculate Net Profit
    const netPL = stratTrades.reduce((sum, t) => sum + (t.pl || 0), 0);

    // Calculate Win Rate
    const closedTrades = stratTrades.filter((t) => ["WIN", "LOSS", "BE"].includes(t.outcome));
    const wins = closedTrades.filter((t) => t.outcome === "WIN").length;
    const winRate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0;

    return { totalTrades, netPL, winRate };
  };

  if (loading) {
    return (
      <div className="w-full text-center py-8 text-slate-500 text-sm">
        Loading strategy catalog...
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 text-white">
      {/* Title block */}
      <div>
        <h2 className="text-xl font-bold tracking-tight">Strategy Playbook</h2>
        <p className="text-xs text-slate-400">Review your rulesets, and track which system generates the highest return.</p>
      </div>

      {errorMsg && (
        <div className="bg-red-950/20 text-red-400 border border-red-800 text-xs p-3 rounded-xl">
          Error: {errorMsg}
        </div>
      )}

      {/* Strategies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {strategies.map((strat) => {
          const { totalTrades, netPL, winRate } = getStrategyStats(strat.id);

          return (
            <div
              key={strat.id}
              onClick={() => setSelectedStrategy(strat)}
              className="bg-slate-900 border border-slate-800 hover:border-indigo-500/50 p-6 rounded-2xl shadow-xl transition cursor-pointer flex flex-col justify-between min-h-[220px]"
            >
              {/* Header */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {strat.style}
                  </span>
                  <span className="text-xs font-semibold text-indigo-400 bg-indigo-950/40 px-2 py-0.5 rounded-lg border border-indigo-900/30">
                    {strat.timeframe}
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-200 mb-1 group-hover:text-white">
                  {strat.name}
                </h3>
                <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed">
                  {strat.description}
                </p>
              </div>

              {/* Real-time Performance Metrics */}
              <div className="mt-6 pt-4 border-t border-slate-800/60 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Trades</span>
                  <span className="font-bold text-slate-200">{totalTrades}</span>
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Win Rate</span>
                  <span className="font-bold text-indigo-400">{winRate.toFixed(0)}%</span>
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">P&L</span>
                  <span className={`font-bold ${netPL >= 0 ? "text-emerald-400" : "text-rose-500"}`}>
                    {netPL >= 0 ? "+" : ""}${netPL.toFixed(0)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Rules Modal Overlay */}
      {selectedStrategy && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-lg w-full rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/30">
              <div>
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                  {selectedStrategy.style} • {selectedStrategy.timeframe}
                </span>
                <h3 className="font-black text-lg text-slate-100 mt-1">
                  {selectedStrategy.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedStrategy(null)}
                className="text-slate-400 hover:text-white font-bold text-sm bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition"
              >
                Close
              </button>
            </div>

            {/* Modal Body (Interactive Rules Checklist) */}
            <div className="p-6 space-y-6">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Strategy Overview</h4>
                <p className="text-slate-300 text-sm leading-relaxed">{selectedStrategy.description}</p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Step-by-Step Entry Rules (Checklist)
                </h4>
                <ul className="space-y-3">
                  {selectedStrategy.rules.map((rule, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 bg-slate-950 border border-slate-800/40 p-3 rounded-xl"
                    >
                      <label className="flex items-start gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          className="w-4 h-4 mt-0.5 rounded bg-slate-950 border-slate-800 accent-indigo-600 cursor-pointer"
                        />
                        <span className="text-xs text-slate-300 leading-normal">{rule}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}