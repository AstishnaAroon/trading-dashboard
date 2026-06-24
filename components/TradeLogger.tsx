"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { supabase } from "../lib/supabaseClient";

interface StrategyOption {
  id: string;
  name: string;
}

export default function TradeLogger() {
  const { user } = useUser();
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const [strategies, setStrategies] = useState<StrategyOption[]>([]);
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>("");

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

  useEffect(() => {
    const fetchStrategies = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("strategies")
        .select("id, name")
        .order("created_at", { ascending: true });

      if (!error) {
        setStrategies(data || []);
      }
    };

    if (user) {
      fetchStrategies();
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMsg("You must be logged in to save trades.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccess(false);

    const tradeData = {
      user_id: user.id,
      pair,
      direction,
      session,
      strategy_id: selectedStrategyId || null,
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

    const { error } = await supabase.from("trades").insert([tradeData]);

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
    } else {
      setSuccess(true);
      setEntryPrice("");
      setExitPrice("");
      setPips("");
      setPl("0");
      setRiskPct("");
      setRrPlanned("");
      setRrActual("");
      setNotes("");
      setSelectedStrategyId("");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full bg-slate border border-iron rounded-[10px] p-6 text-bone flex flex-col h-full"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[14px] font-bold uppercase tracking-widest text-ash">Log New Entry</h3>
        <span className="material-symbols-outlined text-ash text-[18px]">edit_note</span>
      </div>

      {success && (
        <div className="bg-graphite border border-iron text-bone text-xs p-3 rounded-sm mb-4 text-center">
          Entry successfully logged to private ledger.
        </div>
      )}
      {errorMsg && (
        <div className="bg-graphite border border-ember-gold text-ember-gold text-xs p-3 rounded-sm mb-4 text-center">
          Error: {errorMsg}
        </div>
      )}

      <div className="space-y-4 flex-1">
        {/* Row 1: Pair & Direction */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">
              Pair
            </label>
            <input
              type="text"
              value={pair}
              onChange={(e) => setPair(e.target.value)}
              placeholder="e.g. EUR/USD"
              className="w-full bg-graphite border border-iron text-bone text-[14px] px-3 py-2 rounded-sm focus:border-ember-gold focus:ring-0 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">
              Direction
            </label>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
              className="w-full bg-graphite border border-iron text-bone text-[14px] px-3 py-2 rounded-sm focus:border-ember-gold focus:ring-0 outline-none appearance-none"
            >
              <option value="LONG">Buy (Long)</option>
              <option value="SHORT">Sell (Short)</option>
            </select>
          </div>
        </div>

        {/* Row 2: Session & Outcome */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">
              Session
            </label>
            <select
              value={session}
              onChange={(e) => setSession(e.target.value)}
              className="w-full bg-graphite border border-iron text-bone text-[14px] px-3 py-2 rounded-sm focus:border-ember-gold focus:ring-0 outline-none appearance-none"
            >
              <option value="London">London</option>
              <option value="New York">New York</option>
              <option value="Asian">Asian</option>
              <option value="Overnight">Overnight</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">
              Outcome
            </label>
            <select
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              className="w-full bg-graphite border border-iron text-bone text-[14px] px-3 py-2 rounded-sm focus:border-ember-gold focus:ring-0 outline-none appearance-none"
            >
              <option value="WIN">Win</option>
              <option value="LOSS">Loss</option>
              <option value="BE">Break Even (BE)</option>
              <option value="UNTAPPED">Untapped</option>
              <option value="INVALID">Invalid</option>
            </select>
          </div>
        </div>

        {/* Strategy Selector */}
        <div>
          <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">
            Setup / Strategy
          </label>
          <select
            value={selectedStrategyId}
            onChange={(e) => setSelectedStrategyId(e.target.value)}
            className="w-full bg-graphite border border-iron text-bone text-[14px] px-3 py-2 rounded-sm focus:border-ember-gold focus:ring-0 outline-none appearance-none"
          >
            <option value="">No Strategy (Discretionary Setup)</option>
            {strategies.map((strat) => (
              <option key={strat.id} value={strat.id}>
                {strat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Row 3: Entry, Exit */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">
              Entry Price
            </label>
            <input
              type="number"
              step="0.00001"
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
              placeholder="e.g. 1.08500"
              className="w-full bg-graphite border border-iron text-bone text-[14px] px-3 py-2 rounded-sm focus:border-ember-gold focus:ring-0 outline-none tabular-nums"
            />
          </div>

          <div>
            <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">
              Exit Price
            </label>
            <input
              type="number"
              step="0.00001"
              value={exitPrice}
              onChange={(e) => setExitPrice(e.target.value)}
              placeholder="e.g. 1.09000"
              className="w-full bg-graphite border border-iron text-bone text-[14px] px-3 py-2 rounded-sm focus:border-ember-gold focus:ring-0 outline-none tabular-nums"
            />
          </div>
        </div>

        {/* Row 4: Pips, P&L */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">
              Pips gained/lost
            </label>
            <input
              type="number"
              step="0.1"
              value={pips}
              onChange={(e) => setPips(e.target.value)}
              placeholder="e.g. 50"
              className="w-full bg-graphite border border-iron text-bone text-[14px] px-3 py-2 rounded-sm focus:border-ember-gold focus:ring-0 outline-none tabular-nums"
            />
          </div>

          <div>
            <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">
              Profit/Loss ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={pl}
              onChange={(e) => setPl(e.target.value)}
              className="w-full bg-graphite border border-iron text-bone text-[14px] px-3 py-2 rounded-sm focus:border-ember-gold focus:ring-0 outline-none tabular-nums"
            />
          </div>
        </div>

        {/* Row 5: Risk % & Planned/Actual RR */}
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
              className="w-full bg-graphite border border-iron rounded-sm px-3 py-2 text-xs text-bone focus:border-ember-gold focus:ring-0 outline-none"
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
              className="w-full bg-graphite border border-iron rounded-sm px-3 py-2 text-xs text-bone focus:border-ember-gold focus:ring-0 outline-none"
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
              className="w-full bg-graphite border border-iron rounded-sm px-3 py-2 text-xs text-bone focus:border-ember-gold focus:ring-0 outline-none"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Contextual observations..."
            rows={3}
            className="w-full bg-graphite border border-iron text-bone text-[14px] px-3 py-2 rounded-sm focus:border-ember-gold focus:ring-0 outline-none resize-none"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full mt-6 bg-white text-inkwell h-12 font-bold text-[14px] rounded-sm hover:bg-bone transition-all duration-200 cursor-pointer uppercase tracking-wider"
      >
        {loading ? "Recording..." : "Log Trade"}
      </button>
    </form>
  );
}