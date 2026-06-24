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

  const [strategies, setStrategies] = useState<StrategyOption[]>([]);
  const [backtestTrades, setBacktestTrades] = useState<BacktestTrade[]>([]);

  const [strategyId, setStrategyId] = useState<string>("");
  const [pair, setPair] = useState<string>("EUR/USD");
  const [direction, setDirection] = useState<string>("LONG");
  const [outcome, setOutcome] = useState<string>("WIN");
  const [pl, setPl] = useState<string>("0");
  const [riskPct, setRiskPct] = useState<string>("");
  const [rrActual, setRrActual] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const fetchBacktestData = async () => {
    if (!user) return;
    setLoading(true);
    setErrorMsg("");

    try {
      const { data: stratData, error: stratError } = await supabase
        .from("strategies")
        .select("id, name")
        .order("created_at", { ascending: true });

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
        .eq("is_backtest", true)
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
      is_backtest: true,
    };

    const { error } = await supabase.from("trades").insert([backtestData]);

    setSaving(false);

    if (error) {
      setErrorMsg(error.message);
    } else {
      setSuccess(true);
      setPl("0");
      setRiskPct("");
      setRrActual("");
      setNotes("");
      setStrategyId("");
      fetchBacktestData();
      setActiveTab("stats");
    }
  };

  const handleDeleteBacktest = async (id: string) => {
    const { error } = await supabase.from("trades").delete().eq("id", id);
    if (!error) {
      fetchBacktestData();
    }
  };

  const totalSimulatedTrades = backtestTrades.length;
  const totalSimulatedPL = backtestTrades.reduce((sum, t) => sum + (t.pl || 0), 0);

  const closedTrades = backtestTrades.filter((t) => ["WIN", "LOSS", "BE"].includes(t.outcome));
  const wins = closedTrades.filter((t) => t.outcome === "WIN").length;
  const simulatedWinRate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0;

  if (loading) {
    return (
      <div className="w-full text-center py-8 text-ash text-xs uppercase tracking-widest">
        Loading backtesting sandbox...
      </div>
    );
  }

  return (
    <div className="w-full bg-slate border border-iron rounded-[10px] overflow-hidden text-bone">
      {/* Header and Tabs */}
      <div className="px-6 py-4 border-b border-iron flex flex-wrap justify-between items-center gap-4 bg-graphite/30">
        <div>
          <h3 className="text-[14px] font-bold uppercase tracking-widest text-ash">Backtesting Sandbox</h3>
          <p className="text-xs text-ash mt-0.5">Verify strategies historically without risking real capital [1].</p>
        </div>

        {/* Tab Controls - Sharp 2px Corners [DESIGN (5).md] */}
        <div className="flex bg-inkwell p-1 rounded-sm border border-iron select-none">
          <button
            onClick={() => {
              setActiveTab("stats");
              setSuccess(false);
              setErrorMsg("");
            }}
            className={`text-xs font-bold px-4 py-2 rounded-sm transition-all duration-200 cursor-pointer ${
              activeTab === "stats" 
                ? "bg-white text-inkwell" 
                : "text-ash hover:text-white"
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
            className={`text-xs font-bold px-4 py-2 rounded-sm transition-all duration-200 cursor-pointer ${
              activeTab === "record" 
                ? "bg-white text-inkwell" 
                : "text-ash hover:text-white"
            }`}
          >
            Record Setup
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-graphite text-ember-gold border-b border-iron text-xs">
          Error: {errorMsg}
        </div>
      )}

      {/* Tab 1: Sandbox Stats & Log */}
      {activeTab === "stats" && (
        <div className="p-6 space-y-6">
          {/* Simulated Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-inkwell border border-iron p-4 rounded-sm text-center md:text-left">
              <span className="block text-[10px] font-bold text-ash uppercase tracking-widest mb-1">
                Simulated Net P&L
              </span>
              <span className={`text-xl font-bold font-mono tabular-nums ${totalSimulatedPL >= 0 ? "text-bone" : "text-ember-gold"}`}>
                {totalSimulatedPL >= 0 ? "+" : "−"}${Math.abs(totalSimulatedPL).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="bg-inkwell border border-iron p-4 rounded-sm text-center md:text-left">
              <span className="block text-[10px] font-bold text-ash uppercase tracking-widest mb-1">
                Simulated Win Rate
              </span>
              <span className="text-xl font-bold text-bone tabular-nums">
                {simulatedWinRate.toFixed(1)}%
              </span>
            </div>

            <div className="bg-inkwell border border-iron p-4 rounded-sm text-center md:text-left">
              <span className="block text-[10px] font-bold text-ash uppercase tracking-widest mb-1">
                Simulated Trades
              </span>
              <span className="text-xl font-bold text-bone tabular-nums">
                {totalSimulatedTrades}
              </span>
            </div>
          </div>

          {/* Sandbox Log Table */}
          <div className="border border-iron rounded-sm overflow-hidden">
            {backtestTrades.length === 0 ? (
              <div className="p-8 text-center text-ash text-xs uppercase tracking-widest">
                No simulated trades recorded yet. Click "Record Setup" to log your first backtest.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-inkwell/50">
                    <tr className="border-b border-iron text-ash">
                      <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider">Pair / Strategy</th>
                      <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider">Type</th>
                      <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider">Outcome</th>
                      <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider">Actual R:R</th>
                      <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-right">P&L ($)</th>
                      <th className="py-3 px-4 text-center text-[11px] font-bold uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-iron">
                    {backtestTrades.map((trade) => (
                      <tr key={trade.id} className="hover:bg-inkwell/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-bone text-[14px]">{trade.pair}</div>
                          <div className="text-[10px] text-ash font-medium">
                            {trade.strategies?.name || "Discretionary Setup"}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            trade.direction === "LONG" ? "bg-graphite border border-iron text-bone" : "bg-graphite border border-iron text-ember-gold"
                          }`}>
                            {trade.direction === "LONG" ? "BUY" : "SELL"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            trade.outcome === "WIN" ? "bg-graphite border border-iron text-bone" : "bg-graphite border border-iron text-ember-gold"
                          }`}>
                            {trade.outcome}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-bone font-mono tabular-nums">
                          {trade.rr_actual ? `${trade.rr_actual.toFixed(2)}` : "—"}
                        </td>
                        <td className={`py-3 px-4 text-right font-bold font-mono tabular-nums ${
                          trade.pl >= 0 ? "text-bone" : "text-ember-gold"
                        }`}>
                          {trade.pl >= 0 ? "+" : "−"}${Math.abs(trade.pl).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleDeleteBacktest(trade.id)}
                            className="text-xs text-ash hover:text-ember-gold font-bold transition-colors cursor-pointer"
                          >
                            DELETE
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
            <div className="bg-graphite border border-iron text-bone text-xs p-3 rounded-sm mb-4 text-center">
              Simulated trade successfully recorded in sandbox [1]!
            </div>
          )}

          {/* Row 1: Pair & Direction */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">
                Instrument
              </label>
              <select
                value={pair}
                onChange={(e) => setPair(e.target.value)}
                className="w-full bg-graphite border border-iron rounded-sm px-4 py-2 text-sm text-bone focus:border-ember-gold focus:ring-0 outline-none appearance-none"
              >
                {PAIRS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">
                Direction
              </label>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value)}
                className="w-full bg-graphite border border-iron rounded-sm px-4 py-2 text-sm text-bone focus:border-ember-gold focus:ring-0 outline-none appearance-none"
              >
                <option value="LONG">Buy (Long)</option>
                <option value="SHORT">Sell (Short)</option>
              </select>
            </div>
          </div>

          {/* Row 2: Strategy Selector & Outcome */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">
                Strategy Playbook Tested
              </label>
              <select
                value={strategyId}
                onChange={(e) => setStrategyId(e.target.value)}
                className="w-full bg-graphite border border-iron rounded-sm px-4 py-2 text-sm text-bone focus:border-ember-gold focus:ring-0 outline-none appearance-none"
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
              <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">
                Simulated Outcome
              </label>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                className="w-full bg-graphite border border-iron rounded-sm px-4 py-2 text-sm text-bone focus:border-ember-gold focus:ring-0 outline-none appearance-none"
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
              <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">
                Simulated P&L ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={pl}
                onChange={(e) => setPl(e.target.value)}
                className="w-full bg-graphite border border-iron rounded-sm px-3 py-2 text-xs text-bone focus:border-ember-gold focus:ring-0 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">
                Risk (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={riskPct}
                onChange={(e) => setRiskPct(e.target.value)}
                placeholder="1%"
                className="w-full bg-graphite border border-iron rounded-sm px-3 py-2 text-xs text-bone focus:border-ember-gold focus:ring-0 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">
                Actual R:R
              </label>
              <input
                type="number"
                step="0.1"
                value={rrActual}
                onChange={(e) => setRrActual(e.target.value)}
                placeholder="e.g. 2.5"
                className="w-full bg-graphite border border-iron rounded-sm px-3 py-2 text-xs text-bone focus:border-ember-gold focus:ring-0 outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">
              Simulation Review Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Why would this trade have hit/missed? What can be optimized?"
              rows={3}
              className="w-full bg-graphite border border-iron rounded-sm px-4 py-2 text-sm text-bone focus:border-ember-gold focus:ring-0 outline-none resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-white text-inkwell h-12 font-bold text-[14px] rounded-sm hover:bg-bone transition-all duration-200 cursor-pointer uppercase tracking-wider"
          >
            {saving ? "Recording..." : "Save Simulated Setup"}
          </button>
        </form>
      )}
    </div>
  );
}