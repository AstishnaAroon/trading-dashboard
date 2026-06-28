"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { supabase } from "../lib/supabaseClient";

interface Trade {
  id: string;
  date: string;
  pair: string;
  direction: string;
  session: string | null;
  pl: number;
  rr_planned: number | null;
  rr_actual: number | null;
  risk_pct: number | null;
  outcome: string;
  followed_rules: boolean;
  be_moved: boolean;
  confluence_score: number | null;
  notes: string | null;
  emotion: string | null;
  entry_price: number | null;
  exit_price: number | null;
  pips: number | null;
  custom_fields: any; // Captures our dynamic custom properties [3]
  strategy_id: string | null;
  strategies: { name: string } | null;
}

interface StrategyOption {
  id: string;
  name: string;
}

const PAIR_INPUTS = ["EUR/USD", "GBP/USD", "AUD/USD", "USD/JPY", "EUR/JPY", "GBP/JPY", "XAU/USD (Gold)"];
const SESSIONS = ["London", "New York", "Asian", "Overnight"];
const OUTCOMES = ["WIN", "LOSS", "BE", "UNTAPPED", "INVALID"];
const EMOTIONS = ["disciplined", "greedy", "fearful", "fomo", "impatient", "anxious"];

export default function TradeHistory() {
  const { user } = useUser();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // UI state controllers
  const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [saveLoading, setSavingLoading] = useState<boolean>(false);
  const [strategies, setStrategies] = useState<StrategyOption[]>([]);

  // Edit form states [3]
  const [editDate, setEditDate] = useState<string>("");
  const [editPair, setEditPair] = useState<string>("");
  const [editDirection, setEditDirection] = useState<string>("");
  const [editSession, setEditSession] = useState<string>("");
  const [editStrategyId, setEditStrategyId] = useState<string>("");
  const [editEntryPrice, setEditEntryPrice] = useState<string>("");
  const [editExitPrice, setEditExitPrice] = useState<string>("");
  const [editPips, setEditPips] = useState<string>("");
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
        custom_fields,
        strategy_id,
        strategies ( name )
      `) // custom_fields successfully included! [3]
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

  const fetchStrategies = async () => {
    const { data, error } = await supabase
      .from("strategies")
      .select("id, name")
      .order("created_at", { ascending: true });
    if (!error) {
      setStrategies(data || []);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTrades();
      fetchStrategies();
    }
  }, [user]);

  // Handle trade deletion [3]
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmDelete = window.confirm("Are you sure you want to permanently delete this entry?");
    if (!confirmDelete) return;

    const { error } = await supabase.from("trades").delete().eq("id", id);
    if (!error) {
      setTrades((prev) => prev.filter((t) => t.id !== id));
    } else {
      alert("Failed to delete trade: " + error.message);
    }
  };

  const formatDateTimeLocal = (dateStr: string) => {
    const dateObj = new Date(dateStr);
    const offset = dateObj.getTimezoneOffset() * 60000;
    return new Date(dateObj.getTime() - offset).toISOString().slice(0, 16);
  };

  // Open the custom slide-over edit panel & populate states with defensive fallback values [1, 3]
  const handleStartEdit = (trade: Trade, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTrade(trade);
    setEditDate(formatDateTimeLocal(trade.date));
    setEditPair(trade.pair || "");
    setEditDirection(trade.direction || "LONG"); // Fixed: Fallback to prevent null select states [1]
    setEditSession(trade.session || "London");     // Fixed: Fallback to prevent null select states [1]
    setEditStrategyId(trade.strategy_id || "");
    setEditEntryPrice(trade.entry_price?.toString() || "");
    setEditExitPrice(trade.exit_price?.toString() || "");
    setEditPips(trade.pips?.toString() || "");
    setEditPL(trade.pl?.toString() || "0");
    setEditRiskPct(trade.risk_pct?.toString() || "");
    setEditRrPlanned(trade.rr_planned?.toString() || "");
    setEditRrActual(trade.rr_actual?.toString() || "");
    setEditOutcome(trade.outcome || "WIN");        // Fixed: Fallback to prevent null select states [1]
    setEditEmotion(trade.emotion || "disciplined"); // Fixed: Fallback to prevent null select states [1]
    setEditConfluence(trade.confluence_score?.toString() || "5");
    setEditFollowedRules(trade.followed_rules ?? true);
    setEditBeMoved(trade.be_moved ?? false);
    setEditNotes(trade.notes || "");
  };

  // Save the edited trade [3]
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
        entry_price: parseFloat(editEntryPrice) || null,
        exit_price: parseFloat(editExitPrice) || null,
        pips: parseFloat(editPips) || null,
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
      alert("Failed to save changes: " + error.message);
    } else {
      setEditingTrade(null);
      fetchTrades();
    }
  };

  // Auto-calculate pips inside the edit panel when prices blur [DESIGN (5).md]
  const handleEditPriceBlur = () => {
    const entry = parseFloat(editEntryPrice);
    const exit = parseFloat(editExitPrice);
    if (isNaN(entry) || isNaN(exit)) return;

    const isJPY = editPair.includes("JPY");
    const isGold = editPair.includes("Gold");

    let calculatedPips = 0;
    if (isJPY) {
      calculatedPips = (exit - entry) * 100;
    } else if (isGold) {
      calculatedPips = (exit - entry) * 10;
    } else {
      calculatedPips = (exit - entry) * 10000;
    }

    if (editDirection === "SHORT") {
      calculatedPips = -calculatedPips;
    }

    setEditPips(calculatedPips.toFixed(1));
  };

  // 1. Calculate stats dynamically inside the component scope (properly before first return!) [1]
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
      <div className="w-full text-center py-8 text-ash text-xs uppercase tracking-widest font-bold animate-pulse">
        Loading private ledger...
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 text-bone relative">
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
            <p className="text-xs text-ash mt-0.5">Click any row to expand full trade parameters.</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-[12px] text-ash select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-bone"></span> Winning
              </div>
              <div className="flex items-center gap-2 text-[12px] text-ash select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-ember-gold"></span> Drawdown
              </div>
            </div>
            {/* Custom SVG Refresh Button */}
            <button
              onClick={fetchTrades}
              className="w-8 h-8 rounded-sm bg-graphite border border-iron flex items-center justify-center text-ash hover:text-white transition-colors cursor-pointer"
              title="Refresh Ledger"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
            </button>
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
          /* Scrollbar hidden horizontal sliding wrapper - 8 columns strictly aligned! [DESIGN (5).md] */
          <div className="overflow-x-auto overflow-y-hidden scrollbar-none relative">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead className="bg-inkwell/50">
                <tr className="border-b border-iron text-ash">
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider">Date & Pair</th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider">Execution</th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider">Pricing</th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider">Sizing</th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider">R:R</th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider">Rules & BE</th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-right">Net Outcome</th>
                  {/* Sticky locked Actions Header [DESIGN (5).md] */}
                  <th className="py-4 px-4 text-center text-[11px] font-bold uppercase tracking-wider sticky right-0 bg-inkwell border-l border-iron z-20 w-[120px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-iron">
                {trades.map((trade) => {
                  const isExpanded = expandedTradeId === trade.id;

                  return (
                    <React.Fragment key={trade.id}>
                      {/* Main Data Row */}
                      <tr 
                        onClick={() => setExpandedTradeId(isExpanded ? null : trade.id)}
                        className="hover:bg-inkwell/30 transition-colors cursor-pointer"
                      >
                        {/* 1. Date & Pair (col 1) */}
                        <td className="px-6 py-4">
                          <div className="font-bold text-bone text-[15px]">{trade.pair}</div>
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

                        {/* 2. Execution (col 2) */}
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            trade.direction === "LONG" ? "bg-graphite border border-iron text-bone" : "bg-graphite border border-iron text-ember-gold"
                          }`}>
                            {trade.direction === "LONG" ? "BUY" : "SELL"}
                          </span>
                          <div className="text-[10px] text-ash capitalize mt-1.5">{trade.session || "—"} Session</div>
                        </td>

                        {/* 3. Pricing (col 3) */}
                        <td className="px-6 py-4 text-xs space-y-1">
                          <p><span className="text-ash font-medium">In:</span> <span className="font-mono text-bone">{trade.entry_price || "—"}</span></p>
                          <p><span className="text-ash font-medium">Out:</span> <span className="font-mono text-bone">{trade.exit_price || "—"}</span></p>
                        </td>

                        {/* 4. Sizing (col 4) */}
                        <td className="px-6 py-4 text-xs space-y-1">
                          <p><span className="text-ash font-medium">Risk:</span> <span className="font-mono text-bone">{trade.risk_pct ? `${trade.risk_pct}%` : "—"}</span></p>
                          <p><span className="text-ash font-medium">Pips:</span> <span className="font-mono text-bone">{trade.pips !== null ? `${trade.pips > 0 ? "+" : ""}${trade.pips}` : "—"}</span></p>
                        </td>

                        {/* 5. R:R (col 5) */}
                        <td className="px-6 py-4 tabular-nums text-[13px] text-bone font-mono space-y-1">
                          <div><span className="text-ash text-[10px]">Act:</span> <strong>{trade.rr_actual ? `${trade.rr_actual.toFixed(1)}R` : "—"}</strong></div>
                          <div className="text-[10px] text-ash">Plan: {trade.rr_planned ? `${trade.rr_planned.toFixed(1)}R` : "—"}</div>
                        </td>

                        {/* 6. Rules & BE (col 6) */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5">
                            <span className={`text-[9px] font-bold tracking-wider inline-block w-fit px-1.5 py-0.5 rounded-sm ${
                              trade.followed_rules ? "bg-graphite text-bone border border-iron" : "bg-graphite text-ember-gold border border-iron"
                            }`}>
                              {trade.followed_rules ? "RULES MET" : "RULES VIOLATED"}
                            </span>
                            {trade.be_moved && (
                              <span className="text-[9px] text-ash font-medium select-none">
                                • Stop Moved to BE
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 7. Net P&L (col 7) */}
                        <td className={`px-6 py-4 tabular-nums text-[15px] font-medium text-right ${
                          trade.pl >= 0 ? "text-bone" : "text-ember-gold"
                        }`}>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm border block w-fit ml-auto mb-1 ${
                            trade.pl >= 0 ? "bg-graphite border-iron text-bone" : "bg-graphite border-iron text-ember-gold"
                          }`}>
                            {trade.outcome}
                          </span>
                          {trade.pl >= 0 ? "+" : "−"}${Math.abs(trade.pl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        {/* 8. Sticky Locked Actions Cell (col 8) [DESIGN (5).md] */}
                        <td className="py-4 px-4 text-center sticky right-0 bg-slate border-l border-iron z-10 w-[120px]">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={(e) => handleStartEdit(trade, e)}
                              className="text-ash hover:text-white font-bold text-[11px] transition-colors cursor-pointer uppercase tracking-wider"
                            >
                              EDIT
                            </button>
                            <button
                              onClick={(e) => handleDelete(trade.id, e)}
                              className="text-ash hover:text-ember-gold font-bold text-[11px] transition-colors cursor-pointer uppercase tracking-wider"
                            >
                              DELETE
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Rows: Renders full 16-parameter metrics ledger details + DYNAMIC USER CUSTOM PROPERTIES (colSpan set to exactly 8!) [DESIGN (5).md] */}
                      {isExpanded && (
                        <tr className="bg-graphite/40 border-b border-iron">
                          <td colSpan={8} className="p-6">
                            <div className="flex flex-col gap-6 max-w-4xl">
                              {/* Standard Details Row Grid */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm text-bone">
                                <div className="space-y-1 bg-inkwell p-3 border border-iron rounded-sm">
                                  <p className="text-[10px] text-ash uppercase font-bold">Metrics</p>
                                  <p className="text-xs"><strong className="text-ash">Entry:</strong> <span className="font-mono tabular-nums">{trade.entry_price || "—"}</span></p>
                                  <p className="text-xs"><strong className="text-ash">Exit:</strong> <span className="font-mono tabular-nums">{trade.exit_price || "—"}</span></p>
                                  <p className="text-xs"><strong className="text-ash">Pips:</strong> <span className="font-mono tabular-nums">{trade.pips || "—"} pips</span></p>
                                </div>

                                <div className="space-y-1 bg-inkwell p-3 border border-iron rounded-sm">
                                  <p className="text-[10px] text-ash uppercase font-bold">Risk Model</p>
                                  <p className="text-xs"><strong className="text-ash">Risk %:</strong> <span className="font-mono">{trade.risk_pct ? `${trade.risk_pct}%` : "—"}</span></p>
                                  <p className="text-xs"><strong className="text-ash">Planned RR:</strong> <span className="font-mono">{trade.rr_planned ? `${trade.rr_planned}R` : "—"}</span></p>
                                </div>

                                <div className="space-y-1 bg-inkwell p-3 border border-iron rounded-sm">
                                  <p className="text-[10px] text-ash uppercase font-bold">Discipline</p>
                                  <p className="text-xs"><strong className="text-ash">Emotion:</strong> <span className="capitalize">{trade.emotion || "—"}</span></p>
                                  <p className="text-xs"><strong className="text-ash">Confluence:</strong> <span className="font-mono">{trade.confluence_score || "—"}/10</span></p>
                                </div>

                                <div className="bg-inkwell p-3 border border-iron rounded-sm flex flex-col justify-between">
                                  <p className="text-[10px] text-ash uppercase font-bold mb-1">Journal Review Notes</p>
                                  <p className="text-xs text-ash leading-relaxed italic line-clamp-3">
                                    "{trade.notes || "No additional observations logged."}"
                                  </p>
                                </div>
                              </div>

                              {/* 
                                DYNAMIC CUSTOM PROPERTIES SHEET [3, DESIGN (5).md]
                                Loops over the trade's custom_fields JSONB block and renders them dynamically based on user-defined types.
                              */}
                              {trade.custom_fields && Object.keys(trade.custom_fields).length > 0 && (
                                <div className="pt-4 border-t border-iron/40 space-y-3">
                                  <p className="text-[10px] text-ember-gold uppercase font-bold tracking-wider">Custom Properties Ledger</p>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    {Object.keys(trade.custom_fields).map((key) => {
                                      const customField = trade.custom_fields[key];
                                      if (!customField || customField.value === undefined || customField.value === null || customField.value === "") return null;

                                      return (
                                        <div key={key} className="bg-inkwell p-3 border border-iron rounded-sm space-y-1">
                                          <span className="block text-[9px] font-bold text-ash uppercase tracking-wider">{key}</span>
                                          {/* Render dynamically by custom type */}
                                          {customField.type === "file" ? (
                                            <a 
                                              href={customField.value} 
                                              target="_blank" 
                                              rel="noopener noreferrer" 
                                              className="text-xs text-bone hover:text-white underline font-semibold block truncate max-w-[180px]"
                                              title="Click to view full attachment"
                                            >
                                              View Attachment
                                            </a>
                                          ) : customField.type === "checkbox" ? (
                                            <span className="text-xs font-mono text-bone font-bold">
                                              {customField.value ? "TRUE" : "FALSE"}
                                            </span>
                                          ) : customField.type === "multi-select" && Array.isArray(customField.value) ? (
                                            <div className="flex flex-wrap gap-1">
                                              {customField.value.map((tag: string) => (
                                                <span key={tag} className="bg-graphite text-bone text-[9px] px-2 py-0.5 rounded-full border border-iron/40">
                                                  {tag}
                                                </span>
                                              ))}
                                            </div>
                                          ) : (
                                            <span className="text-xs font-mono text-bone font-medium truncate block max-w-[180px]" title={String(customField.value)}>
                                              {String(customField.value)}
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
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

      {/* 3. Sleek, Distinct Slide-Over Edit Drawer Panel [3] */}
      {editingTrade && (
        <div className="fixed inset-0 z-50 overflow-hidden font-sans select-none">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-obsidian/80 backdrop-blur-sm transition-opacity"
            onClick={() => setEditingTrade(null)}
          />

          {/* Drawer container */}
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="pointer-events-auto w-screen max-w-md bg-slate border-l border-iron flex flex-col justify-between">
              
              <div className="px-6 py-5 border-b border-iron bg-graphite/40 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-bone">Edit Ledger Entry</h3>
                  <p className="text-[10px] text-ash uppercase tracking-wider mt-0.5">Modify logged trade parameters.</p>
                </div>
                <button
                  onClick={() => setEditingTrade(null)}
                  className="text-ash hover:text-white font-bold text-xs bg-graphite hover:bg-iron px-3 py-1.5 rounded-sm border border-iron transition cursor-pointer"
                >
                  CLOSE
                </button>
              </div>

              {/* Drawer Body - Form Fields (Completely expanded edit features!) [3] */}
              <form onSubmit={handleSaveEdit} className="flex-1 p-6 space-y-4 overflow-y-auto scrollbar-none">
                {/* Date/Time */}
                <div>
                  <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">Entry Date & Time</label>
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

                {/* Entry/Exit Prices */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">Entry Price</label>
                    <input
                      type="number"
                      step="0.00001"
                      value={editEntryPrice}
                      onChange={(e) => setEditEntryPrice(e.target.value)}
                      onBlur={handleEditPriceBlur}
                      className="w-full bg-graphite border border-iron text-bone text-[14px] px-3 py-2 rounded-sm focus:border-ember-gold focus:ring-0 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">Exit Price</label>
                    <input
                      type="number"
                      step="0.00001"
                      value={editExitPrice}
                      onChange={(e) => setEditExitPrice(e.target.value)}
                      onBlur={handleEditPriceBlur}
                      className="w-full bg-graphite border border-iron text-bone text-[14px] px-3 py-2 rounded-sm focus:border-ember-gold focus:ring-0 outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Pips / P&L */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">Pips</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editPips}
                      onChange={(e) => setEditPips(e.target.value)}
                      className="w-full bg-graphite border border-iron text-bone text-[14px] px-3 py-2 rounded-sm focus:border-ember-gold focus:ring-0 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">Net P&L ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editPL}
                      onChange={(e) => setEditPL(e.target.value)}
                      className="w-full bg-graphite border border-iron text-bone text-[14px] px-3 py-2 rounded-sm focus:border-ember-gold focus:ring-0 outline-none font-mono"
                      required
                    />
                  </div>
                </div>

                {/* Risk % and Planned/Actual RR */}
                <div className="grid grid-cols-3 gap-3">
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
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Planned RR</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editRrPlanned}
                      onChange={(e) => setEditRrPlanned(e.target.value)}
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

                {/* Emotion and Confluence */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">Emotion</label>
                    <select
                      value={editEmotion}
                      onChange={(e) => setEditEmotion(e.target.value)}
                      className="w-full bg-graphite border border-iron text-bone text-[14px] px-3 py-2 rounded-sm focus:border-ember-gold"
                    >
                      {EMOTIONS.map((em) => (
                        <option key={em} value={em}>{em}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">Confluence (0-10)</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={editConfluence}
                      onChange={(e) => setEditConfluence(e.target.value)}
                      className="w-full bg-graphite border border-iron text-bone text-[14px] px-3 py-2 rounded-sm"
                    />
                  </div>
                </div>

                {/* Checkboxes (Followed Rules & BE) */}
                <div className="flex items-center gap-6 py-2 select-none">
                  {/* Custom Checkbox: Followed Rules */}
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={editFollowedRules}
                        onChange={(e) => setEditFollowedRules(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-4.5 h-4.5 rounded-sm border transition-colors duration-150 flex items-center justify-center ${
                        editFollowedRules ? "bg-white border-white text-inkwell" : "bg-graphite border-iron text-transparent"
                      }`}>
                        {editFollowedRules && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 4L4 7L9 1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-ash font-bold">Followed Rules</span>
                  </label>

                  {/* Custom Checkbox: Moved BE */}
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={editBeMoved}
                        onChange={(e) => setEditBeMoved(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-4.5 h-4.5 rounded-sm border transition-colors duration-150 flex items-center justify-center ${
                        editBeMoved ? "bg-white border-white text-inkwell" : "bg-graphite border-iron text-transparent"
                      }`}>
                        {editBeMoved && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 4L4 7L9 1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-ash font-bold">Moved to BE</span>
                  </label>
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

              {/* Drawer Footer Actions */}
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