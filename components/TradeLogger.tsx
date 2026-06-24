"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { supabase } from "../lib/supabaseClient";

interface StrategyOption {
  id: string;
  name: string;
}

const PAIR_INPUTS = ["EUR/USD", "GBP/USD", "AUD/USD", "USD/JPY", "EUR/JPY", "GBP/JPY", "XAU/USD (Gold)"];
const SESSIONS = ["London", "New York", "Asian", "Overnight"];
const OUTCOMES = ["WIN", "LOSS", "BE", "UNTAPPED", "INVALID"];
const EMOTIONS = ["disciplined", "greedy", "fearful", "fomo", "impatient", "anxious"];

export default function TradeLogger() {
  const { user } = useUser();
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const [strategies, setStrategies] = useState<StrategyOption[]>([]);
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>("");

  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const [pair, setPair] = useState<string>("EUR/USD");
  const [direction, setDirection] = useState<string>("LONG");
  const [session, setSession] = useState<string>("London");
  const [outcome, setOutcome] = useState<string>("WIN");
  const [entryPrice, setEntryPrice] = useState<string>("");
  const [exitPrice, setExitPrice] = useState<string>("");
  const [pips, setPips] = useState<string>("");
  const [pl, setPl] = useState<string>("0");
  const [riskPct, setRiskPct] = useState<string>("");
  const [rrPlanned, setRrPlanned] = useState<string>("");
  const [rrActual, setRrActual] = useState<string>("");
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
      entry_price: Math.abs(parseFloat(entryPrice)) || null,
      exit_price: Math.abs(parseFloat(exitPrice)) || null,
      pips: parseFloat(pips) || null,
      pl: parseFloat(pl) || 0,
      risk_pct: Math.abs(parseFloat(riskPct)) || null,
      rr_planned: Math.abs(parseFloat(rrPlanned)) || null,
      rr_actual: Math.abs(parseFloat(rrActual)) || null,
      outcome,
      emotion,
      confluence_score: Math.abs(parseInt(confluence)) || 5,
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

  const cleanInputOnBlur = (value: string, setter: (val: string) => void, fallback = "") => {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) {
      setter(fallback);
    } else {
      setter(Math.abs(parsed).toString());
    }
  };

  // Custom SVG caret component to replace the problematic Material Icons [DESIGN (5).md]
  const CaretIcon = () => (
    <svg
      width="10"
      height="6"
      viewBox="0 0 10 6"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 ml-2"
    >
      <path
        d="M1 1L5 5L9 1"
        stroke="#cc9166"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full bg-slate border border-iron rounded-[10px] p-6 text-bone flex flex-col h-full relative"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[14px] font-bold uppercase tracking-widest text-ash">Log New Entry</h3>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#777a88" strokeWidth="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
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

      {activeDropdown && (
        <div
          className="fixed inset-0 z-30 bg-transparent cursor-default"
          onClick={() => setActiveDropdown(null)}
        />
      )}

      <div className="space-y-4 flex-1">
        <div className="grid grid-cols-2 gap-4">
          {/* Pair Select */}
          <div className="relative">
            <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">Pair</label>
            <div
              onClick={() => setActiveDropdown(activeDropdown === "pair" ? null : "pair")}
              className="w-full bg-graphite border border-iron text-bone text-[14px] px-3 py-2 rounded-sm flex items-center justify-between cursor-pointer select-none"
            >
              <span className="font-semibold">{pair}</span>
              <CaretIcon />
            </div>
            {activeDropdown === "pair" && (
              <div className="absolute left-0 right-0 mt-1 bg-inkwell border border-iron rounded-sm shadow-2xl z-40 max-h-48 overflow-y-auto divide-y divide-iron/20">
                {PAIR_INPUTS.map((p) => (
                  <div
                    key={p}
                    onClick={() => {
                      setPair(p);
                      setActiveDropdown(null);
                    }}
                    className={`px-4 py-2 text-xs text-bone hover:bg-slate cursor-pointer ${pair === p ? "bg-graphite text-white font-bold" : ""}`}
                  >
                    {p}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Direction Select */}
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

        {/* Row 2: Session & Outcome Selectors */}
        <div className="grid grid-cols-2 gap-4">
          {/* Session Select */}
          <div className="relative">
            <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">Session</label>
            <div
              onClick={() => setActiveDropdown(activeDropdown === "session" ? null : "session")}
              className="w-full bg-graphite border border-iron text-bone text-[14px] px-3 py-2 rounded-sm flex items-center justify-between cursor-pointer select-none"
            >
              <span className="font-semibold">{session}</span>
              <CaretIcon />
            </div>
            {activeDropdown === "session" && (
              <div className="absolute left-0 right-0 mt-1 bg-inkwell border border-iron rounded-sm shadow-2xl z-40 max-h-40 overflow-y-auto">
                {SESSIONS.map((s) => (
                  <div
                    key={s}
                    onClick={() => {
                      setSession(s);
                      setActiveDropdown(null);
                    }}
                    className={`px-4 py-2.5 text-xs text-bone hover:bg-slate cursor-pointer ${session === s ? "bg-graphite font-bold" : ""}`}
                  >
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Outcome Select */}
          <div className="relative">
            <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">Outcome</label>
            <div
              onClick={() => setActiveDropdown(activeDropdown === "outcome" ? null : "outcome")}
              className="w-full bg-graphite border border-iron text-bone text-[14px] px-3 py-2 rounded-sm flex items-center justify-between cursor-pointer select-none"
            >
              <span className="font-semibold">{outcome}</span>
              <CaretIcon />
            </div>
            {activeDropdown === "outcome" && (
              <div className="absolute left-0 right-0 mt-1 bg-inkwell border border-iron rounded-sm shadow-2xl z-40 max-h-40 overflow-y-auto">
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

        {/* Strategy Selector with Custom Dropdown */}
        <div className="relative">
          <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">Setup / Strategy</label>
          <div
            onClick={() => setActiveDropdown(activeDropdown === "strategy" ? null : "strategy")}
            className="w-full bg-graphite border border-iron text-bone text-[14px] px-3 py-2 rounded-sm flex items-center justify-between cursor-pointer select-none"
          >
            <span className="font-semibold truncate max-w-[200px]">
              {strategies.find((s) => s.id === selectedStrategyId)?.name || "Discretionary Setup"}
            </span>
            <CaretIcon />
          </div>
          {activeDropdown === "strategy" && (
            <div className="absolute left-0 right-0 mt-1 bg-inkwell border border-iron rounded-sm shadow-2xl z-40 max-h-48 overflow-y-auto">
              <div
                onClick={() => {
                  setSelectedStrategyId("");
                  setActiveDropdown(null);
                }}
                className={`px-4 py-2.5 text-xs text-bone hover:bg-slate cursor-pointer ${selectedStrategyId === "" ? "bg-graphite font-bold" : ""}`}
              >
                Discretionary Setup
              </div>
              {strategies.map((strat) => (
                <div
                  key={strat.id}
                  onClick={() => {
                    setSelectedStrategyId(strat.id);
                    setActiveDropdown(null);
                  }}
                  className={`px-4 py-2.5 text-xs text-bone hover:bg-slate cursor-pointer ${
                    selectedStrategyId === strat.id ? "bg-graphite font-bold" : ""
                  }`}
                >
                  {strat.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Row 3: Entry, Exit prices */}
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
              onBlur={() => cleanInputOnBlur(entryPrice, setEntryPrice, "")}
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
              onBlur={() => cleanInputOnBlur(exitPrice, setExitPrice, "")}
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
              onBlur={() => cleanInputOnBlur(riskPct, setRiskPct, "")}
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
              onBlur={() => cleanInputOnBlur(rrPlanned, setRrPlanned, "")}
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
              onBlur={() => cleanInputOnBlur(rrActual, setRrActual, "")}
              placeholder="2.5"
              className="w-full bg-graphite border border-iron rounded-sm px-3 py-2 text-xs text-bone focus:border-ember-gold focus:ring-0 outline-none"
            />
          </div>
        </div>

        {/* Row 6: Emotion Custom Select */}
        <div className="relative">
          <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">Emotion</label>
          <div
            onClick={() => setActiveDropdown(activeDropdown === "emotion" ? null : "emotion")}
            className="w-full bg-graphite border border-iron text-bone text-[14px] px-3 py-2 rounded-sm flex items-center justify-between cursor-pointer select-none"
          >
            <span className="font-semibold capitalize">{emotion}</span>
            <CaretIcon />
          </div>
          {activeDropdown === "emotion" && (
            <div className="absolute left-0 right-0 mt-1 bg-inkwell border border-iron rounded-sm shadow-2xl z-40 max-h-40 overflow-y-auto">
              {EMOTIONS.map((em) => (
                <div
                  key={em}
                  onClick={() => {
                    setEmotion(em);
                    setActiveDropdown(null);
                  }}
                  className={`px-4 py-2.5 text-xs text-bone hover:bg-slate cursor-pointer capitalize ${emotion === em ? "bg-graphite font-bold" : ""}`}
                >
                  {em}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Row 7: Checkboxes */}
        <div className="flex items-center gap-6 py-1 select-none">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={followedRules}
              onChange={(e) => setFollowedRules(e.target.checked)}
              className="w-4 h-4 rounded-sm bg-graphite border-iron accent-ember-gold"
            />
            <span className="text-xs text-ash font-bold">Followed Rules</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={beMoved}
              onChange={(e) => setBeMoved(e.target.checked)}
              className="w-4 h-4 rounded-sm bg-graphite border-iron accent-ember-gold"
            />
            <span className="text-xs text-ash font-bold">Moved to BE</span>
          </label>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">Notes</label>
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