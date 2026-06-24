"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { supabase } from "../lib/supabaseClient";

interface StrategyOption {
  id: string;
  name: string;
}

interface BacktestTrade {
  id: string;
  date: string;
  pair: string;
  direction: string;
  pl: number;
  risk_pct: number | null;
  rr_actual: number | null;
  outcome: string;
  notes: string | null;
  strategies: { name: string } | null;
}

const PAIRS = ["EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD"];

export default function BacktestEngine() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<"stats" | "record">("stats");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // States for database data
  const [strategies, setStrategies] = useState<StrategyOption[]>([]);
  const [backtestTrades, setBacktestTrades] = useState<BacktestTrade[]>([]);

  // Form states matching our exact schema (quarantined with is_backtest: true) [1]
  const [strategyId, setStrategyId] = useState<string>("");
  const [pair, setPair] = useState<string>("EUR/USD");
  const [direction, setDirection] = useState<string>("LONG");
  const [outcome, setOutcome] = useState<string>("WIN");
  const [pl, setPl] = useState<string>("0");
  const [riskPct, setRiskPct] = useState<string>("");
  const [rrActual, setRrActual] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Fetch strategies & backtest trades from database [1]
  const fetchBacktestData = async () => {
    if (!user) return;
    setLoading(true);
    setErrorMsg("");

    try {
      // 1. Fetch available strategies to populate dropdown
      const { data: stratData, error: stratError } = await supabase
        .from("strategies")
        .select("id, name")
        .order("created_at", { ascending: true });

      // 2. Fetch only quarantined backtest trades [1]
      const { data: tradeData, error: tradeError } = await supabase
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
          notes,
          strategies ( name )
        `)
        .eq("user_id", user.id)
        .eq("is_backtest", true) // CRUCIAL: Fetch only simulated sandbox data [1]
        .order("date", { ascending: false });

      if (stratError) throw stratError;
      if (tradeError) throw tradeError;

      setStrategies(stratData || []);
      setBacktestTrades(tradeData as unknown as BacktestTrade[] || []);
    } catch (err: any) {
      console.error("Error loading backtest data:", err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBacktestData();
    }
  }, [user]);

  // Handle logging a new simulated trade [1]
  const handleSubmitBacktest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setErrorMsg("");
    setSuccess(false);

    const backtestData = {
      user_id: user.id,
      pair,
      direction,
      strategy_id: strategyId || null,
      pl: parseFloat(pl) || 0,
      risk_pct: parseFloat(riskPct) || null,
      rr_actual: parseFloat(rrActual) || null,
      outcome,
      notes: notes || null,
      is_backtest: true, // CRUCIAL: Quarantine as a backtest [1]
    };

    const { error } = await supabase.from("trades").insert([backtestData]);

    setSaving(false);

    if (error) {
      setErrorMsg(error.message);
    } else {
      setSuccess(true);
      // Reset non-essential fields
      setPl("0");
      setRiskPct("");
      setRrActual("");
      setNotes("");
      setStrategyId("");
      fetchBacktestData(); // Refresh history immediately [3]
      setActiveTab("stats"); // Return to stats view to see results
    }
  };

  // Delete a backtest trade
  const handleDeleteBacktest = async (id: string) => {
    const { error } = await supabase.from("trades").delete().eq("id", id);
    if (!error) {
      fetchBacktestData();
    }
  };

  // Sandbox calculations [1]
  const totalSimulatedTrades = backtestTrades.length;
  const totalSimulatedPL = backtestTrades.reduce((sum, t) => sum + (t.pl || 0), 0);

  // Win rate calculations
  const closedTrades = backtestTrades.filter((t) => ["WIN", "LOSS", "BE"].includes(t.outcome));
  const wins = closedTrades.filter((t) => t.outcome === "WIN").length;
  const simulatedWinRate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0;

  if (loading) {
    return (
      <div className="w-full text-center py-8 text-slate-500 text-sm">
        Loading backtesting sandbox...
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden text-white">
      {/* Header and Tabs */}
      <div className="px-6 py-4 border-b border-slate-800 flex flex-wrap justify-between items-center gap-4 bg-slate-950/20">
        <div>
          <h3 className="font-bold text-base">Backtesting Sandbox</h3>
          <p className="text-xs text-slate-400">Verify strategies historically without risking real capital [1].</p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => {
              setActiveTab("stats");
              setSuccess(false);
              setErrorMsg("");
            }}
            className={`text-xs font-bold px-4 py-2 rounded-lg transition ${
              activeTab === "stats" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Sandbox Stats & Log
          </button>
          <button
            onClick={() => {
              setActiveTab("record");
              setSuccess(false);
              setErrorMsg("");
            }}
            className={`text-xs font-bold px-4 py-2 rounded-lg transition ${
              activeTab === "record" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Record Setup
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-950/20 text-red-400 border-b border-slate-800 text-xs">
          Error: {errorMsg}
        </div>
      )}

      {/* Tab 1: Sandbox Stats & Log */}
      {activeTab === "stats" && (
        <div className="p-6 space-y-6">
          {/* Simulated Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950 border border-slate-800/60 p-4 rounded-xl text-center md:text-left">
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                Simulated Net P&L
              </span>
              <span className={`text-xl font-bold ${totalSimulatedPL >= 0 ? "text-emerald-400" : "text-rose-500"}`}>
                {totalSimulatedPL >= 0 ? "+" : ""}${totalSimulatedPL.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="bg-slate-950 border border-slate-800/60 p-4 rounded-xl text-center md:text-left">
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                Simulated Win Rate
              </span>
              <span className="text-xl font-bold text-indigo-400">
                {simulatedWinRate.toFixed(1)}%
              </span>
            </div>

            <div className="bg-slate-950 border border-slate-800/60 p-4 rounded-xl text-center md:text-left">
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                Simulated Trades
              </span>
              <span className="text-xl font-bold text-slate-200">
                {totalSimulatedTrades}
              </span>
            </div>
          </div>

          {/* Sandbox Log Table */}
          <div className="border border-slate-800 rounded-xl overflow-hidden">
            {backtestTrades.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No simulated trades recorded yet. Click "Record Setup" above to log your first backtest.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950/40 text-slate-500 font-bold border-b border-slate-800">
                      <th className="py-3.5 px-4 uppercase tracking-wider">Pair / Strategy</th>
                      <th className="py-3.5 px-4 uppercase tracking-wider">Type</th>
                      <th className="py-3.5 px-4 uppercase tracking-wider">Outcome</th>
                      <th className="py-3.5 px-4 uppercase tracking-wider">Actual R:R</th>
                      <th className="py-3.5 px-4 uppercase tracking-wider text-right">P&L ($)</th>
                      <th className="py-3.5 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {backtestTrades.map((trade) => (
                      <tr key={trade.id} className="hover:bg-slate-800/10 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-200">{trade.pair}</div>
                          <div className="text-[10px] text-slate-400 font-medium">
                            {trade.strategies?.name || "Discretionary Setup"}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            trade.direction === "LONG" ? "bg-indigo-950/40 text-indigo-400" : "bg-amber-950/40 text-amber-500"
                          }`}>
                            {trade.direction === "LONG" ? "BUY" : "SELL"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            trade.outcome === "WIN" ? "bg-emerald-950/40 text-emerald-400" :
                            trade.outcome === "LOSS" ? "bg-rose-950/40 text-rose-400" :
                            "bg-slate-800 text-slate-400"
                          }`}>
                            {trade.outcome}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-300 font-mono">
                          {trade.rr_actual ? `${trade.rr_actual}R` : "—"}
                        </td>
                        <td className={`py-3 px-4 text-right font-bold font-mono ${
                          trade.pl >= 0 ? "text-emerald-400" : "text-rose-500"
                        }`}>
                          {trade.pl >= 0 ? "+" : ""}${trade.pl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleDeleteBacktest(trade.id)}
                            className="text-xs text-slate-500 hover:text-red-400 font-semibold transition"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Record Setup Form */}
      {activeTab === "record" && (
        <form onSubmit={handleSubmitBacktest} className="p-6 space-y-4">
          {success && (
            <div className="bg-emerald-950/50 border border-emerald-800 text-emerald-400 text-xs p-3 rounded-xl mb-4">
              Simulated trade successfully recorded in sandbox [1]!
            </div>
          )}

          {/* Row 1: Pair & Direction */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Instrument
              </label>
              <select
                value={pair}
                onChange={(e) => setPair(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none"
              >
                {PAIRS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Direction
              </label>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none"
              >
                <option value="LONG">Buy (Long)</option>
                <option value="SHORT">Sell (Short)</option>
              </select>
            </div>
          </div>

          {/* Row 2: Strategy Selector & Outcome */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Strategy Playbook Tested
              </label>
              <select
                value={strategyId}
                onChange={(e) => setStrategyId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none"
              >
                <option value="">No Strategy (Discretionary Setup)</option>
                {strategies.map((strat) => (
                  <option key={strat.id} value={strat.id}>
                    {strat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Simulated Outcome
              </label>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none"
              >
                <option value="WIN">Win</option>
                <option value="LOSS">Loss</option>
                <option value="BE">Break Even (BE)</option>
              </select>
            </div>
          </div>

          {/* Row 3: P&L, Risk %, Actual RR */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Simulated P&L ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={pl}
                onChange={(e) => setPl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-xs text-slate-200 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Risk (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={riskPct}
                onChange={(e) => setRiskPct(e.target.value)}
                placeholder="1%"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-xs text-slate-200 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Actual R:R
              </label>
              <input
                type="number"
                step="0.1"
                value={rrActual}
                onChange={(e) => setRrActual(e.target.value)}
                placeholder="e.g. 2.5"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-xs text-slate-200 outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Simulation Review Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Why would this trade have hit/missed? What can be optimized?"
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium py-3 px-4 rounded-xl transition cursor-pointer"
          >
            {saving ? "Recording Simulation..." : "Save Simulated Setup"}
          </button>
        </form>
      )}
    </div>
  );
}