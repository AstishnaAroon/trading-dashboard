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

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    setErrorMsg("");

    try {
      const { data: stratData, error: stratError } = await supabase
        .from("strategies")
        .select("*")
        .order("created_at", { ascending: true });

      const { data: tradeData, error: tradeError } = await supabase
        .from("trades")
        .select("strategy_id, pl, outcome")
        .eq("user_id", user.id)
        .eq("is_backtest", false);

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

  const getStrategyStats = (stratId: string) => {
    const stratTrades = trades.filter((t) => t.strategy_id === stratId);
    const totalTrades = stratTrades.length;

    const netPL = stratTrades.reduce((sum, t) => sum + (t.pl || 0), 0);

    const closedTrades = stratTrades.filter((t) => ["WIN", "LOSS", "BE"].includes(t.outcome));
    const wins = closedTrades.filter((t) => t.outcome === "WIN").length;
    const winRate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0;

    return { totalTrades, netPL, winRate };
  };

  if (loading) {
    return (
      <div className="w-full text-center py-8 text-ash text-xs uppercase tracking-widest">
        Loading strategy playbook...
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 text-bone">
      {/* Title block */}
      <div>
        <h2 className="text-[14px] font-bold uppercase tracking-widest text-ash">Strategy Playbook</h2>
        <p className="text-xs text-ash mt-0.5 font-medium">Review your rulesets, and track which system generates the highest return.</p>
      </div>

      {errorMsg && (
        <div className="bg-graphite text-ember-gold border border-iron text-xs p-3 rounded-sm">
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
              className="bg-slate border border-iron hover:border-ash p-6 rounded-[10px] shadow-xl transition cursor-pointer flex flex-col justify-between min-h-[220px]"
            >
              {/* Header */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2 py-0.5 bg-graphite border border-iron text-[10px] font-bold text-ash uppercase tracking-widest rounded-sm">
                    {strat.style}
                  </span>
                  <span className="text-[11px] font-semibold text-pearl bg-transparent border border-steel px-2 py-0.5 rounded-full select-none">
                    {strat.timeframe}
                  </span>
                </div>
                <h3 className="font-bold text-base text-bone mb-1">
                  {strat.name}
                </h3>
                <p className="text-ash text-xs line-clamp-2 leading-relaxed">
                  {strat.description}
                </p>
              </div>

              {/* Real-time Performance Metrics */}
              <div className="mt-6 pt-4 border-t border-iron grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <span className="block text-[9px] font-bold text-ash uppercase tracking-wider mb-0.5">Trades</span>
                  <span className="font-bold text-bone tabular-nums">{totalTrades}</span>
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-ash uppercase tracking-wider mb-0.5">Win Rate</span>
                  <span className="font-bold text-bone tabular-nums">{winRate.toFixed(0)}%</span>
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-ash uppercase tracking-wider mb-0.5">P&L</span>
                  <span className={`font-bold font-mono tabular-nums ${netPL >= 0 ? "text-bone" : "text-ember-gold"}`}>
                    {netPL >= 0 ? "+" : "−"}${Math.abs(netPL).toFixed(0)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Rules Modal Overlay */}
      {selectedStrategy && (
        <div className="fixed inset-0 bg-obsidian/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate border border-iron max-w-lg w-full rounded-[10px] shadow-2xl overflow-hidden animate-fadeIn">
            {/* Modal Header */}
            <div className="p-6 border-b border-iron flex justify-between items-center bg-graphite/30">
              <div>
                <span className="text-[10px] font-black text-ember-gold uppercase tracking-widest">
                  {selectedStrategy.style} • {selectedStrategy.timeframe}
                </span>
                <h3 className="font-bold text-lg text-bone mt-1">
                  {selectedStrategy.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedStrategy(null)}
                className="text-bone hover:text-white font-bold text-xs bg-graphite hover:bg-iron px-3 py-1.5 rounded-sm border border-iron transition cursor-pointer"
              >
                CLOSE
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              <div>
                <h4 className="text-[11px] font-bold text-ash uppercase tracking-wider mb-2">Strategy Overview</h4>
                <p className="text-bone text-sm leading-relaxed">{selectedStrategy.description}</p>
              </div>

              <div>
                <h4 className="text-[11px] font-bold text-ash uppercase tracking-wider mb-3">
                  Step-by-Step Entry Rules (Checklist)
                </h4>
                <ul className="space-y-3">
                  {selectedStrategy.rules.map((rule, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 bg-inkwell border border-iron p-3 rounded-sm"
                    >
                      <label className="flex items-start gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          className="w-4 h-4 mt-0.5 rounded-sm bg-graphite border-iron accent-ember-gold cursor-pointer"
                        />
                        <span className="text-xs text-bone leading-normal">{rule}</span>
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