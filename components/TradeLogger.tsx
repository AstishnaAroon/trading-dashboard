"use client";

import React, { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { supabase } from "../lib/supabaseClient";

export default function TradeLogger() {
  const { user } = useUser(); // Get the logged-in user from Clerk [2]
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Form State variables matching your exact schema
  const [pair, setPair] = useState<string>("EUR/USD");
  const [direction, setDirection] = useState<string>("LONG");
  const [session, setSession] = useState<string>("London");
  const [entryPrice, setEntryPrice] = useState<string>("");
  const [exitPrice, setExitPrice] = useState<string>("");
  const [pips, setPips] = useState<string>("");
  const [pl, setPl] = useState<string>("0");
  const [riskPct, setRiskPct] = useState<string>("");
  const [rrPlanned, setRrPlanned] = useState<string>("");
  const [rrActual, setRrActual] = useState<string>("");
  const [outcome, setOutcome] = useState<string>("WIN");
  const [emotion, setEmotion] = useState<string>("disciplined");
  const [confluence, setConfluence] = useState<string>("5");
  const [followedRules, setFollowedRules] = useState<boolean>(true);
  const [beMoved, setBeMoved] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMsg("You must be logged in to save trades.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccess(false);

    // Prepare data (safe-casting empty strings to null or numbers)
    const tradeData = {
      user_id: user.id, // Attach Clerk User ID to database record
      pair,
      direction,
      session,
      entry_price: parseFloat(entryPrice) || null,
      exit_price: parseFloat(exitPrice) || null,
      pips: parseFloat(pips) || null,
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
      is_backtest: false,
    };

    // Insert trade into Supabase
    const { error } = await supabase.from("trades").insert([tradeData]);

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
    } else {
      setSuccess(true);
      // Reset non-essential fields on success
      setEntryPrice("");
      setExitPrice("");
      setPips("");
      setPl("0");
      setRiskPct("");
      setRrPlanned("");
      setRrActual("");
      setNotes("");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6 text-white"
    >
      <h2 className="text-xl font-bold mb-1 tracking-tight">Log a New Trade</h2>
      <p className="text-slate-400 text-xs mb-6">Record advanced metrics to review and analyze performance.</p>

      {/* Success/Error Alerts */}
      {success && (
        <div className="bg-emerald-950/50 border border-emerald-800 text-emerald-400 text-xs p-3 rounded-xl mb-6">
          Trade successfully logged in the database!
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-950/50 border border-red-800 text-red-400 text-xs p-3 rounded-xl mb-6">
          Error: {errorMsg}
        </div>
      )}

      <div className="space-y-4">
        {/* Row 1: Pair & Direction */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Pair
            </label>
            <input
              type="text"
              value={pair}
              onChange={(e) => setPair(e.target.value)}
              placeholder="e.g. EUR/USD"
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Direction
            </label>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none"
            >
              <option value="LONG">Buy (Long)</option>
              <option value="SHORT">Sell (Short)</option>
            </select>
          </div>
        </div>

        {/* Row 2: Session & Outcome */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Session
            </label>
            <select
              value={session}
              onChange={(e) => setSession(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none"
            >
              <option value="London">London</option>
              <option value="New York">New York</option>
              <option value="Asian">Asian</option>
              <option value="Overnight">Overnight</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Outcome
            </label>
            <select
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none"
            >
              <option value="WIN">Win</option>
              <option value="LOSS">Loss</option>
              <option value="BE">Break Even (BE)</option>
              <option value="UNTAPPED">Untapped</option>
              <option value="INVALID">Invalid</option>
            </select>
          </div>
        </div>

        {/* Row 3: Entry, Exit, Pips, P&L */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Entry Price
            </label>
            <input
              type="number"
              step="0.00001"
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
              placeholder="e.g. 1.08500"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Exit Price
            </label>
            <input
              type="number"
              step="0.00001"
              value={exitPrice}
              onChange={(e) => setExitPrice(e.target.value)}
              placeholder="e.g. 1.09000"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Pips gained/lost
            </label>
            <input
              type="number"
              step="0.1"
              value={pips}
              onChange={(e) => setPips(e.target.value)}
              placeholder="e.g. 50"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Profit/Loss ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={pl}
              onChange={(e) => setPl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm"
            />
          </div>
        </div>

        {/* Row 4: Risk % & Planned/Actual RR */}
        <div className="grid grid-cols-3 gap-3">
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
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-xs"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Planned R:R
            </label>
            <input
              type="number"
              step="0.1"
              value={rrPlanned}
              onChange={(e) => setRrPlanned(e.target.value)}
              placeholder="3"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-xs"
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
              placeholder="2.5"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-xs"
            />
          </div>
        </div>

        {/* Row 5: Confluence, Emotion */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Confluence (0-10)
            </label>
            <input
              type="number"
              min="0"
              max="10"
              value={confluence}
              onChange={(e) => setConfluence(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Emotion
            </label>
            <select
              value={emotion}
              onChange={(e) => setEmotion(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm"
            >
              <option value="disciplined">Disciplined</option>
              <option value="greedy">Greedy</option>
              <option value="fearful">Fearful</option>
              <option value="fomo">FOMO</option>
              <option value="impatient">Impatient</option>
              <option value="anxious">Anxious</option>
            </select>
          </div>
        </div>

        {/* Row 6: Checkboxes for Rules and BE */}
        <div className="flex items-center gap-6 py-2">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={followedRules}
              onChange={(e) => setFollowedRules(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-950 border-slate-800 accent-indigo-600"
            />
            <span className="text-xs text-slate-300">Followed Rules</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={beMoved}
              onChange={(e) => setBeMoved(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-950 border-slate-800 accent-indigo-600"
            />
            <span className="text-xs text-slate-300">Moved to BE</span>
          </label>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Trade Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Review setup, market bias, or errors made..."
            rows={3}
            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none resize-none"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium py-3 px-4 rounded-xl transition cursor-pointer"
      >
        {loading ? "Saving Trade..." : "Log Trade to Database"}
      </button>
    </form>
  );
}