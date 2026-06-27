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
  session: string | null;
  pl: number;
  risk_pct: number | null;
  rr_planned: number | null;
  rr_actual: number | null;
  outcome: string;
  followed_rules: boolean;
  be_moved: boolean;
  confluence_score: number | null;
  notes: string | null;
  emotion: string | null;
  entry_price: number | null;
  exit_price: number | null;
  pips: number | null;
  strategy_id: string | null;
  strategies: { name: string } | null;
}

const PAIRS = ["EUR/USD", "GBP/USD", "AUD/USD", "USD/JPY", "EUR/JPY", "GBP/JPY", "XAU/USD (Gold)"];
const OUTCOMES = ["WIN", "LOSS", "BE"];
const SESSIONS = ["London", "New York", "Asian", "Overnight"];
const EMOTIONS = ["disciplined", "greedy", "fearful", "fomo", "impatient", "anxious"];

// Helper function to format current local time to "YYYY-MM-DDThh:mm" [3]
const getLocalISODateTime = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 16);
};

export default function BacktestEngine() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<"stats" | "record">("stats");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // UI state controllers [3]
  const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null);
  const [editingTrade, setEditingTrade] = useState<BacktestTrade | null>(null);
  const [saveLoading, setSavingLoading] = useState<boolean>(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Database Data States
  const [strategies, setStrategies] = useState<StrategyOption[]>([]);
  const [backtestTrades, setBacktestTrades] = useState<BacktestTrade[]>([]);

  // Form states (Date/Time picker added!) [3]
  const [date, setDate] = useState<string>(getLocalISODateTime());
  const [pair, setPair] = useState<string>("EUR/USD");
  const [direction, setDirection] = useState<string>("LONG");
  const [session, setSession] = useState<string>("London");
  const [strategyId, setStrategyId] = useState<string>("");
  const [outcome, setOutcome] = useState<string>("WIN");
  const [pl, setPl] = useState<string>("0");
  const [riskPct, setRiskPct] = useState<string>("");
  const [rrPlanned, setRrPlanned] = useState<string>("");
  const [rrActual, setRrActual] = useState<string>("");
  const [emotion, setEmotion] = useState<string>("disciplined");
  const [confluence, setConfluence] = useState<string>("5");
  const [followedRules, setFollowedRules] = useState<boolean>(true);
  const [beMoved, setBeMoved] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>("");

  // Edit Drawer form states [3]
  const [editDate, setEditDate] = useState<string>("");
  const [editPair, setEditPair] = useState<string>("");
  const [editDirection, setEditDirection] = useState<string>("");
  const [editSession, setEditSession] = useState<string>("");
  const [editStrategyId, setEditStrategyId] = useState<string>("");
  const [editPL, setEditPL] = useState<string>("");
  const [editRiskPct, setEditRiskPct] = useState<string>("");
  const [editRrPlanned, setEditRrPlanned] = useState<string>("");
  const [editRrActual, setEditRrActual] = useState<string>("");
  const [editOutcome, setEditOutcome] = useState<string>("");
  const [editEmotion, setEditEmotion] = useState<string>("");
  const [editConfluence, setEditConfluence] = useState<string>("");
  const [editFollowedRules, setEditFollowedRules] = useState<boolean>(true);
  const [editBeMoved, setEditBeMoved] = useState<boolean>(false);
  const [editNotes, setEditNotes] = useState<string>("");

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
          session,
          pl,
          risk_pct,
          rr_planned,
          rr_actual,
          outcome,
          followed_rules,
          be_moved,
          confluence_score,
          notes,
          emotion,
          entry_price,
          exit_price,
          pips,
          strategy_id,
          strategies ( name )
        `)
        .eq("user_id", user.id)
        .eq("is_backtest", true) // Quarantined simulated data [1]
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
      date: new Date(date).toISOString(), // Saves custom simulation timestamp [3]
      pair,
      direction,
      session,
      strategy_id: strategyId || null,
      pl: parseFloat(pl) || 0,
      risk_pct: parseFloat(riskPct) || null,
      rr_planned: parseFloat(rrPlanned) || null,
      rr_actual: parseFloat(rrActual) || null,
      outcome,
      emotion,
      confluence_score: parseInt(confluence) || 5,
      followed_rules: followedRules,
      be_moved: beMoved,
      notes: notes || null,
      is_backtest: true, // Keep isolated in backtesting log [1]
    };

    const { error } = await supabase.from("trades").insert([backtestData]);

    setSaving(false);

    if (error) {
      setErrorMsg(error.message);
    } else {
      setSuccess(true);
      setPl("0");
      setRiskPct("");
      setRrPlanned("");
      setRrActual("");
      setNotes("");
      setStrategyId("");
      setDate(getLocalISODateTime());
      fetchBacktestData();
      setActiveTab("stats");
    }
  };

  const handleDeleteBacktest = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmDelete = window.confirm("Are you sure you want to permanently delete this simulated run?");
    if (!confirmDelete) return;

    const { error } = await supabase.from("trades").delete().eq("id", id);
    if (!error) {
      setBacktestTrades((prev) => prev.filter((t) => t.id !== id));
    } else {
      alert("Failed to delete: " + error.message);
    }
  };

  const formatDateTimeLocal = (dateStr: string) => {
    const dateObj = new Date(dateStr);
    const offset = dateObj.getTimezoneOffset() * 60000;
    return new Date(dateObj.getTime() - offset).toISOString().slice(0, 16);
  };

  const handleStartEdit = (trade: BacktestTrade, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTrade(trade);
    setEditDate(formatDateTimeLocal(trade.date));
    setEditPair(trade.pair);
    setEditDirection(trade.direction);
    setEditSession(trade.session || "London");
    setEditStrategyId(trade.strategy_id || "");
    setEditPL(trade.pl.toString());
    setEditRiskPct(trade.risk_pct?.toString() || "");
    setEditRrPlanned(trade.rr_planned?.toString() || "");
    setEditRrActual(trade.rr_actual?.toString() || "");
    setEditOutcome(trade.outcome);
    setEditEmotion(trade.emotion || "disciplined");
    setEditConfluence(trade.confluence_score?.toString() || "5");
    setEditFollowedRules(trade.followed_rules);
    setEditBeMoved(trade.be_moved);
    setEditNotes(trade.notes || "");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrade) return;

    setSavingLoading(true);
    const { error } = await supabase
      .from("trades")
      .update({
        date: new Date(editDate).toISOString(),
        pair: editPair,
        direction: editDirection,
        session: editSession,
        strategy_id: editStrategyId || null,
        pl: parseFloat(editPL) || 0,
        risk_pct: parseFloat(editRiskPct) || null,
        rr_planned: parseFloat(editRrPlanned) || null,
        rr_actual: parseFloat(editRrActual) || null,
        outcome: editOutcome,
        emotion: editEmotion,
        confluence_score: parseInt(editConfluence) || 5,
        followed_rules: editFollowedRules,
        be_moved: editBeMoved,
        notes: editNotes || null,
      })
      .eq("id", editingTrade.id);

    setSavingLoading(false);

    if (error) {
      alert("Failed to save: " + error.message);
    } else {
      setEditingTrade(null);
      fetchBacktestData();
    }
  };

  const cleanInputOnBlur = (value: string, setter: (val: string) => void, fallback = "") => {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) {
      setter(fallback);
    } else {
      setter(Math.abs(parsed).toString());
    }
  };

  const CaretIcon = () => (
    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 ml-2">
      <path d="M1 1L5 5L9 1" stroke="#cc9166" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );

  const totalSimulatedTrades = backtestTrades.length;
  const totalSimulatedPL = backtestTrades.reduce((sum, t) => sum + (t.pl || 0), 0);
  const closedTrades = backtestTrades.filter((t) => ["WIN", "LOSS", "BE"].includes(t.outcome));
  const wins = closedTrades.filter((t) => t.outcome === "WIN").length;
  const simulatedWinRate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0;

  if (loading) {
    return (
      <div className="w-full text-center py-8 text-ash text-xs uppercase tracking-widest font-bold">
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
              activeTab === "stats" ? "bg-white text-inkwell" : "text-ash hover:text-white"
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
              activeTab === "record" ? "bg-white text-inkwell" : "text-ash hover:text-white"
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

      {activeDropdown && (
        <div className="fixed inset-0 z-30 bg-transparent cursor-default" onClick={() => setActiveDropdown(null)} />
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

          {/* Sandbox Log Table - Scrollbar hidden and sticky actions column [DESIGN (5).md] */}
          <div className="border border-iron rounded-sm overflow-hidden">
            {backtestTrades.length === 0 ? (
              <div className="p-8 text-center text-ash text-xs uppercase tracking-widest">
                No simulated trades recorded yet. Click "Record Setup" to log your first backtest.
              </div>
            ) : (
              <div className="overflow-x-auto scrollbar-none relative">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead className="bg-inkwell/50">
                    <tr className="border-b border-iron text-ash">
                      <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider">Date / Pair / Strategy</th>
                      <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider">Type</th>
                      <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider">Outcome</th>
                      <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider">Actual RR</th>
                      <th className="py-3 px-4 text-[11px] font-bold uppercase tracking-wider text-right">P&L ($)</th>
                      <th className="py-3.5 px-4 text-center text-[11px] font-bold uppercase tracking-wider sticky right-0 bg-inkwell border-l border-iron z-20 w-[120px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-iron">
                    {backtestTrades.map((trade) => {
                      const isExpanded = expandedTradeId === trade.id;

                      return (
                        <React.Fragment key={trade.id}>
                          <tr 
                            onClick={() => setExpandedTradeId(isExpanded ? null : trade.id)}
                            className="hover:bg-inkwell/30 transition-colors cursor-pointer"
                          >
                            <td className="py-3 px-4">
                              <div className="font-bold text-bone text-[14px]">{trade.pair}</div>
                              <div className="text-[10px] text-ash font-medium truncate max-w-[150px]">
                                {trade.strategies?.name || "Discretionary Setup"}
                              </div>
                              <div className="text-[9px] text-slate-500 mt-1">
                                {new Date(trade.date).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
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
                            {/* Sticky locked Actions cell [DESIGN (5).md] */}
                            <td className="py-3 px-4 text-center sticky right-0 bg-slate border-l border-iron z-10 w-[120px]">
                              <div className="flex items-center justify-center gap-3">
                                <button
                                  onClick={(e) => handleStartEdit(trade, e)}
                                  className="text-ash hover:text-white font-bold text-[11px] transition-colors cursor-pointer uppercase tracking-wider"
                                >
                                  EDIT
                                </button>
                                <button
                                  onClick={(e) => handleDeleteBacktest(trade.id, e)}
                                  className="text-ash hover:text-ember-gold font-bold text-[11px] transition-colors cursor-pointer uppercase tracking-wider"
                                >
                                  DELETE
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded detail row [1, DESIGN (5).md] */}
                          {isExpanded && (
                            <tr className="bg-graphite/40 border-b border-iron">
                              <td colSpan={6} className="p-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm text-bone max-w-4xl">
                                  <div className="space-y-1 bg-inkwell p-3 border border-iron rounded-sm">
                                    <p className="text-[10px] text-ash uppercase font-bold">Metrics</p>
                                    <p className="text-xs"><strong className="text-ash">Risk %:</strong> <span className="font-mono">{trade.risk_pct ? `${trade.risk_pct}%` : "—"}</span></p>
                                    <p className="text-xs"><strong className="text-ash">Planned RR:</strong> <span className="font-mono">{trade.rr_planned ? `${trade.rr_planned}R` : "—"}</span></p>
                                    <p className="text-xs"><strong className="text-ash">Session:</strong> <span className="capitalize">{trade.session || "—"}</span></p>
                                  </div>

                                  <div className="space-y-1 bg-inkwell p-3 border border-iron rounded-sm">
                                    <p className="text-[10px] text-ash uppercase font-bold">Discipline</p>
                                    <p className="text-xs"><strong className="text-ash">Emotion:</strong> <span className="capitalize">{trade.emotion || "—"}</span></p>
                                    <p className="text-xs"><strong className="text-ash">Confluence:</strong> <span className="font-mono">{trade.confluence_score || "—"}/10</span></p>
                                    <p className="text-xs"><strong className="text-ash">Adherence:</strong> <span>{trade.followed_rules ? "Followed Rules" : "Violated Rules"}</span></p>
                                  </div>

                                  <div className="bg-inkwell p-3 border border-iron rounded-sm flex flex-col justify-between col-span-2">
                                    <p className="text-[10px] text-ash uppercase font-bold mb-1">Simulation Review</p>
                                    <p className="text-xs text-ash leading-relaxed italic line-clamp-3">
                                      "{trade.notes || "No additional observations logged."}"
                                    </p>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
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

          {/* Date Picker */}
          <div>
            <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">
              Simulation Date & Time
            </label>
            <input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-graphite border border-iron text-bone text-[14px] px-3 py-2 rounded-sm focus:border-ember-gold focus:ring-0 outline-none tabular-nums"
              required
            />
          </div>

          {/* Row 1: Pair & Direction Custom Selects */}
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">Instrument</label>
              <div
                onClick={() => setActiveDropdown(activeDropdown === "pair" ? null : "pair")}
                className="w-full bg-graphite border border-iron text-bone text-[14px] px-3 py-2 rounded-sm flex items-center justify-between cursor-pointer select-none"
              >
                <span className="font-semibold">{pair}</span>
                <CaretIcon />
              </div>
              {activeDropdown === "pair" && (
                <div className="absolute left-0 right-0 mt-1 bg-inkwell border border-iron rounded-sm shadow-2xl z-40 max-h-48 overflow-y-auto divide-y divide-iron/20">
                  {PAIRS.map((p) => (
                    <div
                      key={p}
                      onClick={() => {
                        setPair(p);
                        setActiveDropdown(null);
                      }}
                      className={`px-4 py-2.5 text-xs text-bone hover:bg-slate cursor-pointer ${pair === p ? "bg-graphite font-bold" : ""}`}
                    >
                      {p}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">Direction</label>
              <div
                onClick={() => setActiveDropdown(activeDropdown === "direction" ? null : "direction")}
                className="w-full bg-graphite border border-iron text-bone text-[14px] px-3 py-2 rounded-sm flex items-center justify-between cursor-pointer select-none"
              >
                <span className="font-semibold">{direction === "LONG" ? "BUY (LONG)" : "SELL (SHORT)"}</span>
                <CaretIcon />
              </div>
              {activeDropdown === "direction" && (
                <div className="absolute left-0 right-0 mt-1 bg-inkwell border border-iron rounded-sm shadow-2xl z-40">
                  <div
                    onClick={() => {
                      setDirection("LONG");
                      setActiveDropdown(null);
                    }}
                    className={`px-4 py-2.5 text-xs text-bone hover:bg-slate cursor-pointer ${direction === "LONG" ? "bg-graphite font-bold" : ""}`}
                  >
                    BUY (LONG)
                  </div>
                  <div
                    onClick={() => {
                      setDirection("SHORT");
                      setActiveDropdown(null);
                    }}
                    className={`px-4 py-2.5 text-xs text-bone hover:bg-slate cursor-pointer ${direction === "SHORT" ? "bg-graphite font-bold" : ""}`}
                  >
                    SELL (SHORT)
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Strategy Selector & Outcome Custom Selects */}
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">Strategy Playbook Tested</label>
              <div
                onClick={() => setActiveDropdown(activeDropdown === "strategy" ? null : "strategy")}
                className="w-full bg-graphite border border-iron text-bone text-[14px] px-3 py-2 rounded-sm flex items-center justify-between cursor-pointer select-none"
              >
                <span className="font-semibold truncate max-w-[200px]">
                  {strategies.find((s) => s.id === strategyId)?.name || "Discretionary Setup"}
                </span>
                <CaretIcon />
              </div>
              {activeDropdown === "strategy" && (
                <div className="absolute left-0 right-0 mt-1 bg-inkwell border border-iron rounded-sm shadow-2xl z-40 max-h-48 overflow-y-auto">
                  <div
                    onClick={() => {
                      setStrategyId("");
                      setActiveDropdown(null);
                    }}
                    className={`px-4 py-2.5 text-xs text-bone hover:bg-slate cursor-pointer ${strategyId === "" ? "bg-graphite text-white font-bold" : ""}`}
                  >
                    Discretionary Setup
                  </div>
                  {strategies.map((strat) => (
                    <div
                      key={strat.id}
                      onClick={() => {
                        setStrategyId(strat.id);
                        setActiveDropdown(null);
                      }}
                      className={`px-4 py-2.5 text-xs text-bone hover:bg-slate cursor-pointer ${
                        strategyId === strat.id ? "bg-graphite text-white font-bold" : ""
                      }`}
                    >
                      {strat.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">Simulated Outcome</label>
              <div
                onClick={() => setActiveDropdown(activeDropdown === "outcome" ? null : "outcome")}
                className="w-full bg-graphite border border-iron text-bone text-[14px] px-3 py-2 rounded-sm flex items-center justify-between cursor-pointer select-none"
              >
                <span className="font-semibold">{outcome}</span>
                <CaretIcon />
              </div>
              {activeDropdown === "outcome" && (
                <div className="absolute left-0 right-0 mt-1 bg-inkwell border border-iron rounded-sm shadow-2xl z-40">
                  {OUTCOMES.map((o) => (
                    <div
                      key={o}
                      onClick={() => {
                        setOutcome(o);
                        setActiveDropdown(null);
                      }}
                      className={`px-4 py-2.5 text-xs text-bone hover:bg-slate cursor-pointer ${outcome === o ? "bg-graphite font-bold" : ""}`}
                    >
                      {o}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Row 3: P&L, Risk %, Actual RR */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">Simulated P&L ($)</label>
              <input
                type="number"
                step="0.01"
                value={pl}
                onChange={(e) => setPl(e.target.value)}
                className="w-full bg-graphite border border-iron rounded-sm px-3 py-2 text-xs text-bone focus:border-ember-gold focus:ring-0 outline-none font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">Risk %</label>
              <input
                type="number"
                step="0.1"
                value={riskPct}
                onChange={(e) => setRiskPct(e.target.value)}
                onBlur={() => cleanInputOnBlur(riskPct, setRiskPct, "")}
                placeholder="1%"
                className="w-full bg-graphite border border-iron rounded-sm px-3 py-2 text-xs text-bone focus:border-ember-gold"
              />
            </div>

            <div>
              <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">Actual RR</label>
              <input
                type="number"
                step="0.1"
                value={rrActual}
                onChange={(e) => setRrActual(e.target.value)}
                onBlur={() => cleanInputOnBlur(rrActual, setRrActual, "")}
                placeholder="e.g. 2.5"
                className="w-full bg-graphite border border-iron rounded-sm px-3 py-2 text-xs text-bone focus:border-ember-gold"
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

      {/* 4. Sleek Slide-Over Edit Drawer for Backtest [3] */}
      {editingTrade && (
        <div className="fixed inset-0 z-50 overflow-hidden font-sans select-none">
          <div className="absolute inset-0 bg-obsidian/80 backdrop-blur-sm transition-opacity" onClick={() => setEditingTrade(null)} />
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="pointer-events-auto w-screen max-w-md bg-slate border-l border-iron flex flex-col justify-between">
              
              <div className="px-6 py-5 border-b border-iron bg-graphite/40 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-bone">Edit Sandbox Entry</h3>
                  <p className="text-[10px] text-ash uppercase tracking-wider mt-0.5">Modify simulated parameters [1].</p>
                </div>
                <button
                  onClick={() => setEditingTrade(null)}
                  className="text-ash hover:text-white font-bold text-xs bg-graphite hover:bg-iron px-3 py-1.5 rounded-sm border border-iron transition cursor-pointer"
                >
                  CLOSE
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="flex-1 p-6 space-y-4 overflow-y-auto scrollbar-none">
                {/* Date/Time */}
                <div>
                  <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">Simulation Date & Time</label>
                  <input
                    type="datetime-local"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full bg-graphite border border-iron text-bone text-[14px] px-3 py-2 rounded-sm focus:border-ember-gold focus:ring-0 outline-none tabular-nums"
                    required
                  />
                </div>

                {/* Pair */}
                <div>
                  <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">Pair</label>
                  <input
                    type="text"
                    value={editPair}
                    onChange={(e) => setEditPair(e.target.value)}
                    className="w-full bg-graphite border border-iron text-bone text-[14px] px-3 py-2 rounded-sm focus:border-ember-gold focus:ring-0 outline-none uppercase font-mono"
                    required
                  />
                </div>

                {/* Direction and Session */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">Direction</label>
                    <select
                      value={editDirection}
                      onChange={(e) => setEditDirection(e.target.value)}
                      className="w-full bg-graphite border border-iron text-bone text-[14px] px-3 py-2 rounded-sm focus:border-ember-gold focus:ring-0 outline-none appearance-none"
                    >
                      <option value="LONG">BUY (LONG)</option>
                      <option value="SHORT">SELL (SHORT)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">Session</label>
                    <select
                      value={editSession}
                      onChange={(e) => setEditSession(e.target.value)}
                      className="w-full bg-graphite border border-iron text-bone text-[14px] px-3 py-2 rounded-sm focus:border-ember-gold focus:ring-0 outline-none appearance-none"
                    >
                      {SESSIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Strategy and Outcome */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">Strategy Tested</label>
                    <select
                      value={editStrategyId}
                      onChange={(e) => setEditStrategyId(e.target.value)}
                      className="w-full bg-graphite border border-iron text-bone text-[14px] px-3 py-2 rounded-sm focus:border-ember-gold focus:ring-0 outline-none appearance-none"
                    >
                      <option value="">No Strategy (Discretionary)</option>
                      {strategies.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">Outcome</label>
                    <select
                      value={editOutcome}
                      onChange={(e) => setEditOutcome(e.target.value)}
                      className="w-full bg-graphite border border-iron text-bone text-[14px] px-3 py-2 rounded-sm focus:border-ember-gold"
                    >
                      {OUTCOMES.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* P&L, Risk % & RR */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">Simulated P&L</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editPL}
                      onChange={(e) => setEditPL(e.target.value)}
                      className="w-full bg-graphite border border-iron text-bone text-[14px] px-3 py-2 rounded-sm focus:border-ember-gold font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Risk %</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editRiskPct}
                      onChange={(e) => setEditRiskPct(e.target.value)}
                      className="w-full bg-graphite border border-iron rounded-sm px-3 py-2 text-xs text-bone"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Actual RR</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editRrActual}
                      onChange={(e) => setEditRrActual(e.target.value)}
                      className="w-full bg-graphite border border-iron rounded-sm px-3 py-2 text-xs text-bone"
                    />
                  </div>
                </div>

                {/* Review Notes */}
                <div>
                  <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">Review Notes</label>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={4}
                    className="w-full bg-graphite border border-iron text-bone text-[14px] px-3 py-2 rounded-sm focus:border-ember-gold focus:ring-0 outline-none resize-none"
                  />
                </div>
              </form>

              <div className="p-6 border-t border-iron bg-graphite/10">
                <button
                  onClick={handleSaveEdit}
                  disabled={saveLoading}
                  className="w-full bg-white text-inkwell h-12 font-bold text-[14px] rounded-sm hover:bg-bone transition-all duration-200 cursor-pointer uppercase tracking-wider"
                >
                  {saveLoading ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}