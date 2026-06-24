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
  strategy_id: string | null;
  strategies: { name: string } | null;
}

export default function TradeHistory() {
  const { user } = useUser();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // UI state controllers
  const [expandedTradeId, setExpandedTradeId] = useState<string | null>(null);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [saveLoading, setSavingLoading] = useState<boolean>(false);

  // Edit form states
  const [editPair, setEditPair] = useState<string>("");
  const [editDirection, setEditDirection] = useState<string>("");
  const [editOutcome, setEditOutcome] = useState<string>("");
  const [editPL, setEditPL] = useState<string>("");
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

  // Handle trade deletion [3]
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevents expanding the row when clicking delete
    const confirmDelete = window.confirm("Are you sure you want to permanently delete this entry?");
    if (!confirmDelete) return;

    const { error } = await supabase.from("trades").delete().eq("id", id);
    if (!error) {
      setTrades((prev) => prev.filter((t) => t.id !== id));
    } else {
      alert("Failed to delete trade: " + error.message);
    }
  };

  // Open the custom slide-over edit panel [3]
  const handleStartEdit = (trade: Trade, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTrade(trade);
    setEditPair(trade.pair);
    setEditDirection(trade.direction);
    setEditOutcome(trade.outcome);
    setEditPL(trade.pl.toString());
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
        pair: editPair,
        direction: editDirection,
        outcome: editOutcome,
        pl: parseFloat(editPL) || 0,
        notes: editNotes || null,
      })
      .eq("id", editingTrade.id);

    setSavingLoading(false);

    if (error) {
      alert("Failed to save: " + error.message);
    } else {
      setEditingTrade(null);
      fetchTrades(); // Refresh the list [3]
    }
  };

  // Stats
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
      <div className="w-full text-center py-8 text-ash text-xs uppercase tracking-widest font-bold">
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
            {/* Elegant Custom Refresh Button [3] */}
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
          /* Horizontally sliding table with completely hidden scrollbar [DESIGN (5).md] */
          <div className="overflow-x-auto overflow-y-hidden scrollbar-none relative">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-inkwell/50">
                <tr className="border-b border-iron text-ash">
                  <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider">Date / Pair</th>
                  <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider">Outcome</th>
                  <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider">Actual RR</th>
                  <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-wider text-right">Net P&L</th>
                  {/* Sticky locked Actions Header [DESIGN (5).md] */}
                  <th className="py-3.5 px-4 text-center text-[11px] font-bold uppercase tracking-wider sticky right-0 bg-inkwell border-l border-iron z-20 w-[120px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-iron">
                {trades.map((trade) => {
                  const isExpanded = expandedTradeId === trade.id;

                  return (
                    <React.Fragment key={trade.id}>
                      {/* Main Data Row (Clicking anywhere here toggles expansion) */}
                      <tr 
                        onClick={() => setExpandedTradeId(isExpanded ? null : trade.id)}
                        className="hover:bg-inkwell/30 transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <div className="font-bold text-bone text-[15px]">{trade.pair}</div>
                          <div className="text-[10px] text-ash font-medium truncate max-w-[150px]">
                            {trade.strategies?.name || "Discretionary Setup"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            trade.direction === "LONG" ? "bg-graphite border border-iron text-bone" : "bg-graphite border border-iron text-ember-gold"
                          }`}>
                            {trade.direction === "LONG" ? "BUY" : "SELL"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            trade.outcome === "WIN" ? "bg-graphite border border-iron text-bone" : "bg-graphite border border-iron text-ember-gold"
                          }`}>
                            {trade.outcome}
                          </span>
                        </td>
                        <td className="px-6 py-4 tabular-nums text-[13px] text-bone font-mono">
                          {trade.rr_actual ? `${trade.rr_actual.toFixed(2)}` : "—"}
                        </td>
                        <td className={`px-6 py-4 tabular-nums text-[15px] font-medium text-right ${
                          trade.pl >= 0 ? "text-bone" : "text-ember-gold"
                        }`}>
                          {trade.pl >= 0 ? "+" : "−"}${Math.abs(trade.pl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        {/* Sticky Locked Actions Cell (Always visible during horizontal slide) [DESIGN (5).md] */}
                        <td className="py-4 px-4 text-center sticky right-0 bg-slate border-l border-iron z-10 w-[120px]">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={(e) => handleStartEdit(trade, e)}
                              className="text-ash hover:text-white font-bold text-[11px] transition-colors cursor-pointer"
                            >
                              EDIT
                            </button>
                            <button
                              onClick={(e) => handleDelete(trade.id, e)}
                              className="text-ash hover:text-ember-gold font-bold text-[11px] transition-colors cursor-pointer"
                            >
                              DELETE
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Rows: Renders full 16-parameter metrics ledger details [DESIGN (5).md] */}
                      {isExpanded && (
                        <tr className="bg-graphite/40 border-b border-iron">
                          <td colSpan={6} className="p-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm text-bone max-w-4xl">
                              {/* Left block: prices */}
                              <div className="space-y-1 bg-inkwell p-3 border border-iron rounded-sm">
                                <p className="text-[10px] text-ash uppercase font-bold">Metrics</p>
                                <p className="text-xs"><strong className="text-ash">Entry:</strong> <span className="font-mono tabular-nums">{trade.entry_price || "—"}</span></p>
                                <p className="text-xs"><strong className="text-ash">Exit:</strong> <span className="font-mono tabular-nums">{trade.exit_price || "—"}</span></p>
                                <p className="text-xs"><strong className="text-ash">Pips:</strong> <span className="font-mono tabular-nums">{trade.pips || "—"} pips</span></p>
                              </div>

                              {/* Mid block: Risk */}
                              <div className="space-y-1 bg-inkwell p-3 border border-iron rounded-sm">
                                <p className="text-[10px] text-ash uppercase font-bold">Risk Model</p>
                                <p className="text-xs"><strong className="text-ash">Risk %:</strong> <span className="font-mono">{trade.risk_pct ? `${trade.risk_pct}%` : "—"}</span></p>
                                <p className="text-xs"><strong className="text-ash">Planned RR:</strong> <span className="font-mono">{trade.rr_planned ? `${trade.rr_planned}R` : "—"}</span></p>
                                <p className="text-xs"><strong className="text-ash">Session:</strong> <span className="capitalize">{trade.session || "—"}</span></p>
                              </div>

                              {/* Psychological state */}
                              <div className="space-y-1 bg-inkwell p-3 border border-iron rounded-sm">
                                <p className="text-[10px] text-ash uppercase font-bold">Discipline</p>
                                <p className="text-xs"><strong className="text-ash">Emotion:</strong> <span className="capitalize">{trade.emotion || "—"}</span></p>
                                <p className="text-xs"><strong className="text-ash">Confluence:</strong> <span className="font-mono">{trade.confluence_score || "—"}/10</span></p>
                                <p className="text-xs"><strong className="text-ash">Adherence:</strong> <span>{trade.followed_rules ? "Followed Rules" : "Violated Rules"}</span></p>
                              </div>

                              {/* Extensive Notes */}
                              <div className="bg-inkwell p-3 border border-iron rounded-sm flex flex-col justify-between col-span-2 md:col-span-1">
                                <p className="text-[10px] text-ash uppercase font-bold mb-1">Journal Review</p>
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

      {/* 3. Sleek, Distinct Slide-Over Edit Drawer Panel [3] */}
      {editingTrade && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-obsidian/80 backdrop-blur-sm transition-opacity"
            onClick={() => setEditingTrade(null)}
          />

          {/* Drawer container */}
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="pointer-events-auto w-screen max-w-md bg-slate border-l border-iron flex flex-col justify-between">
              
              {/* Drawer Header */}
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

              {/* Drawer Body - Form Fields */}
              <form onSubmit={handleSaveEdit} className="flex-1 p-6 space-y-5 overflow-y-auto">
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

                {/* Direction Selector */}
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

                {/* Outcome Selector */}
                <div>
                  <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">Outcome</label>
                  <select
                    value={editOutcome}
                    onChange={(e) => setEditOutcome(e.target.value)}
                    className="w-full bg-graphite border border-iron text-bone text-[14px] px-3 py-2 rounded-sm focus:border-ember-gold focus:ring-0 outline-none appearance-none"
                  >
                    <option value="WIN">WIN</option>
                    <option value="LOSS">LOSS</option>
                    <option value="BE">BREAK EVEN (BE)</option>
                  </select>
                </div>

                {/* P&L */}
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

                {/* Notes */}
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