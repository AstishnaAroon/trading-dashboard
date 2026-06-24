"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { supabase } from "../lib/supabaseClient";

interface Trade {
  id: string;
  date: string;
  pair: string;
  direction: string;
  pl: number;
  risk_pct: number | null;
  rr_actual: number | null;
  outcome: string;
  strategy_id: string | null;
  strategies: { name: string } | null;
}

export default function TradeHistory() {
  const { user } = useUser();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const fetchTrades = async () => {
    if (!user) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from("trades")
      .select(`
        id, 
        date, 
        pair, 
        direction, 
        pl, 
        risk_pct, 
        rr_actual, 
        outcome, 
        strategy_id,
        strategies ( name )
      `)
      .eq("user_id", user.id)
      .eq("is_backtest", false)
      .order("date", { ascending: false });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setTrades(data as unknown as Trade[] || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchTrades();
    }
  }, [user]);

  // Calculations
  const totalPL = trades.reduce((sum, t) => sum + (t.pl || 0), 0);
  
  const closedTrades = trades.filter(t => ["WIN", "LOSS", "BE"].includes(t.outcome));
  const wins = closedTrades.filter(t => t.outcome === "WIN").length;
  const winRate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0;

  const rrTrades = trades.filter(t => t.rr_actual !== null);
  const averageRR = rrTrades.length > 0 
    ? rrTrades.reduce((sum, t) => sum + (t.rr_actual || 0), 0) / rrTrades.length 
    : 0;

  if (loading) {
    return (
      <div className="w-full text-center py-8 text-ash text-xs uppercase tracking-widest">
        Loading private ledger...
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 text-bone">
      {/* 1. Statistics Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
        {/* Total P&L Card */}
        <div className="bg-slate border border-iron p-5 rounded-[10px] text-center md:text-left">
          <span className="block text-[10px] font-bold text-ash uppercase tracking-widest mb-1">
            Total Net P&L
          </span>
          <span className={`text-2xl font-black tabular-nums ${totalPL >= 0 ? "text-bone" : "text-ember-gold"}`}>
            {totalPL >= 0 ? "+" : "−"}${Math.abs(totalPL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Win Rate Card */}
        <div className="bg-slate border border-iron p-5 rounded-[10px] text-center md:text-left">
          <span className="block text-[10px] font-bold text-ash uppercase tracking-widest mb-1">
            Win Rate (Closed)
          </span>
          <span className="text-2xl font-black text-bone tabular-nums">
            {winRate.toFixed(1)}%
          </span>
        </div>

        {/* Avg R:R Card */}
        <div className="bg-slate border border-iron p-5 rounded-[10px] text-center md:text-left">
          <span className="block text-[10px] font-bold text-ash uppercase tracking-widest mb-1">
            Average Actual R:R
          </span>
          <span className="text-2xl font-black text-bone tabular-nums">
            {averageRR.toFixed(1)}R
          </span>
        </div>
      </div>

      {/* 2. Historical Data Table */}
      <div className="bg-slate border border-iron rounded-[10px] overflow-hidden">
        <div className="px-6 py-4 border-b border-iron bg-graphite/30 flex justify-between items-center">
          <div>
            <h3 className="text-[14px] font-bold uppercase tracking-widest text-ash">Recent Activity Ledger</h3>
            <p className="text-xs text-ash mt-0.5">Historical verification of past entries.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[12px] text-ash select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-bone"></span> Winning
            </div>
            <div className="flex items-center gap-2 text-[12px] text-ash select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-ember-gold"></span> Drawdown
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-4 bg-graphite text-ember-gold border-b border-iron text-xs">
            Error loading log: {errorMsg}
          </div>
        )}

        {trades.length === 0 ? (
          <div className="p-8 text-center text-ash text-xs uppercase tracking-widest">
            No trades recorded yet. Fill out the Trade Logger form to make your first entry.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-inkwell/50">
                <tr className="border-b border-iron text-ash">
                  <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider">Pair</th>
                  <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider">Strategy</th>
                  <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider">Outcome</th>
                  <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider">RR</th>
                  <th className="px-6 py-3 text-[11px] font-bold uppercase tracking-wider text-right">Net P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-iron">
                {trades.map((trade) => (
                  <tr key={trade.id} className="hover:bg-inkwell/30 transition-colors">
                    <td className="px-6 py-4 tabular-nums text-[13px] text-ash">
                      {new Date(trade.date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-bone text-[15px]">{trade.pair}</span>
                    </td>
                    <td className="px-6 py-4 text-ash text-[12px]">
                      {trade.strategies?.name || "Discretionary"}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        trade.outcome === "WIN" 
                          ? "bg-graphite border border-iron text-bone" 
                          : "bg-graphite border border-iron text-ember-gold"
                      }`}>
                        {trade.outcome}
                      </span>
                    </td>
                    <td className="px-6 py-4 tabular-nums text-[13px]">
                      {trade.rr_actual ? `${trade.rr_actual.toFixed(2)}` : "—"}
                    </td>
                    <td className={`px-6 py-4 tabular-nums text-[15px] font-medium text-right ${
                      trade.pl >= 0 ? "text-bone" : "text-ember-gold"
                    }`}>
                      {trade.pl >= 0 ? "+" : "−"}${Math.abs(trade.pl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}