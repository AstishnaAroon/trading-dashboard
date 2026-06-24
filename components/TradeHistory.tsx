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
  strategies: { name: string } | null; // Captures the nested strategy name from our database JOIN [3]
}

export default function TradeHistory() {
  const { user } = useUser();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Fetch trades from Supabase with a nested JOIN on strategies table [3]
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
      `) // Fetches the strategy name linked to this trade [3]
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setTrades(data as unknown as Trade[] || []);
    }
    setLoading(false);
  };

  // Run the fetch when the Clerk user is loaded
  useEffect(() => {
    if (user) {
      fetchTrades();
    }
  }, [user]);

  // Calculations
  const totalPL = trades.reduce((sum, t) => sum + (t.pl || 0), 0);
  
  // Calculate win rate from closed trades (WIN, LOSS, BE)
  const closedTrades = trades.filter(t => ["WIN", "LOSS", "BE"].includes(t.outcome));
  const wins = closedTrades.filter(t => t.outcome === "WIN").length;
  const winRate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0;

  // Calculate average actual R:R
  const rrTrades = trades.filter(t => t.rr_actual !== null);
  const averageRR = rrTrades.length > 0 
    ? rrTrades.reduce((sum, t) => sum + (t.rr_actual || 0), 0) / rrTrades.length 
    : 0;

  if (loading) {
    return (
      <div className="w-full text-center py-8 text-slate-500 text-sm">
        Loading trade history...
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 text-white">
      {/* 1. Statistics Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
        {/* Total P&L Card */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl text-center md:text-left">
          <span className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
            Total Net P&L
          </span>
          <span className={`text-2xl font-black ${totalPL >= 0 ? "text-emerald-400" : "text-rose-500"}`}>
            {totalPL >= 0 ? "+" : ""}${totalPL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Win Rate Card */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl text-center md:text-left">
          <span className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
            Win Rate (Closed)
          </span>
          <span className="text-2xl font-black text-indigo-400">
            {winRate.toFixed(1)}%
          </span>
        </div>

        {/* Avg R:R Card */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl text-center md:text-left">
          <span className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
            Average Actual R:R
          </span>
          <span className="text-2xl font-black text-slate-200">
            {averageRR.toFixed(1)}R
          </span>
        </div>
      </div>

      {/* 2. Historical Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-base">Trade History Log</h3>
            <p className="text-xs text-slate-400">A historical breakdown of your past entries.</p>
          </div>
          <button 
            onClick={fetchTrades}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-3 py-1.5 rounded-lg transition"
          >
            Refresh Log
          </button>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-950/20 text-red-400 border-b border-slate-800 text-xs">
            Error loading log: {errorMsg}
          </div>
        )}

        {trades.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No trades recorded yet. Fill out the Trade Logger form above to make your first entry.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-950/50 text-slate-500 font-bold border-b border-slate-800">
                  <th className="py-4 px-6 text-xs uppercase tracking-wider">Date/Pair</th>
                  <th className="py-4 px-6 text-xs uppercase tracking-wider">Type</th>
                  <th className="py-4 px-6 text-xs uppercase tracking-wider">Risk %</th>
                  <th className="py-4 px-6 text-xs uppercase tracking-wider">Actual R:R</th>
                  <th className="py-4 px-6 text-xs uppercase tracking-wider">Outcome</th>
                  <th className="py-4 px-6 text-xs uppercase tracking-wider text-right">P&L ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {trades.map((trade) => (
                  <tr key={trade.id} className="hover:bg-slate-800/20 transition">
                    <td className="py-3 px-6">
                      <div className="font-bold text-slate-200">{trade.pair}</div>
                      {/* Displays the linked strategy name dynamically or defaults to discretionary */}
                      <div className="text-[10px] text-slate-400 font-medium">
                        {trade.strategies?.name || "Discretionary Setup"}
                      </div>
                      <div className="text-[9px] text-slate-500 mt-0.5">
                        {new Date(trade.date).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-6 text-xs">
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        trade.direction === "LONG" 
                          ? "bg-indigo-950/50 text-indigo-400 border border-indigo-800/50" 
                          : "bg-amber-950/50 text-amber-500 border border-amber-800/50"
                      }`}>
                        {trade.direction === "LONG" ? "BUY" : "SELL"}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-slate-300">
                      {trade.risk_pct ? `${trade.risk_pct}%` : "—"}
                    </td>
                    <td className="py-3 px-6 text-slate-300">
                      {trade.rr_actual ? `${trade.rr_actual}R` : "—"}
                    </td>
                    <td className="py-3 px-6 text-xs">
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        trade.outcome === "WIN" ? "bg-emerald-950/50 text-emerald-400" :
                        trade.outcome === "LOSS" ? "bg-rose-950/50 text-rose-400" :
                        "bg-slate-800 text-slate-400"
                      }`}>
                        {trade.outcome}
                      </span>
                    </td>
                    <td className={`py-3 px-6 text-right font-bold ${
                      trade.pl >= 0 ? "text-emerald-400" : "text-rose-500"
                    }`}>
                      {trade.pl >= 0 ? "+" : ""}${trade.pl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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