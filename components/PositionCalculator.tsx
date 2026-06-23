"use client";

import React, { useState } from "react";

export default function PositionCalculator() {
  // Input states (we use strings so users can type and clear inputs easily)
  const [balance, setBalance] = useState<string>("10000");
  const [riskPercent, setRiskPercent] = useState<string>("1");
  const [stopLoss, setStopLoss] = useState<string>("15");
  const [instrument, setInstrument] = useState<string>("standard");
  const [customPipValue, setCustomPipValue] = useState<string>("10");

  // Determine the correct pip value per Standard Lot based on instrument selection
  const getPipValue = (): number => {
    if (instrument === "standard") return 10; // Standard USD Pairs (EURUSD, GBPUSD)
    if (instrument === "jpy") return 9.2;    // JPY Pairs average approximation (USDJPY, EURJPY)
    return parseFloat(customPipValue) || 10;  // Custom pairs (Gold, Crypto, etc.)
  };

  // Convert inputs to numbers safely to prevent NaN (Not a Number) crashes
  const balanceNum = parseFloat(balance) || 0;
  const riskPercentNum = parseFloat(riskPercent) || 0;
  const stopLossNum = parseFloat(stopLoss) || 0;
  const pipValueNum = getPipValue();

  // Mathematical calculations
  const riskAmount = balanceNum * (riskPercentNum / 100);
  
  // Safe calculation to avoid "division by zero" crashes
  const lotSize = stopLossNum > 0 && pipValueNum > 0 
    ? riskAmount / (stopLossNum * pipValueNum) 
    : 0;

  return (
    <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6 text-white">
      <h2 className="text-xl font-bold mb-1 tracking-tight">Position Size Calculator</h2>
      <p className="text-slate-400 text-xs mb-6">Calculate standard lot sizes while managing account risk.</p>

      <div className="space-y-4">
        {/* Account Balance Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Account Balance ($)
          </label>
          <input
            type="number"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            placeholder="e.g. 10000"
            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition"
          />
        </div>

        {/* Row for Risk % and Stop Loss */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Risk (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={riskPercent}
              onChange={(e) => setRiskPercent(e.target.value)}
              placeholder="e.g. 1"
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Stop Loss (Pips)
            </label>
            <input
              type="number"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              placeholder="e.g. 15"
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition"
            />
          </div>
        </div>

        {/* Instrument Dropdown Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Instrument Type
          </label>
          <select
            value={instrument}
            onChange={(e) => setInstrument(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition appearance-none"
          >
            <option value="standard">Standard Pairs ($10/pip per lot)</option>
            <option value="jpy">JPY Pairs (~$9.20/pip per lot)</option>
            <option value="custom">Custom Pip Value</option>
          </select>
        </div>

        {/* Custom Pip Value Input (Shows only if "custom" is selected) */}
        {instrument === "custom" && (
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Custom Pip Value ($ per standard lot)
            </label>
            <input
              type="number"
              step="0.1"
              value={customPipValue}
              onChange={(e) => setCustomPipValue(e.target.value)}
              placeholder="10"
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition"
            />
          </div>
        )}
      </div>

      {/* Results Display */}
      <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-2 gap-4">
        <div className="bg-slate-950 border border-slate-800/50 p-4 rounded-xl text-center">
          <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
            Amount at Risk
          </span>
          <span className="text-lg font-bold text-red-500">
            ${riskAmount.toFixed(2)}
          </span>
        </div>

        <div className="bg-slate-950 border border-slate-800/50 p-4 rounded-xl text-center">
          <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
            Recommended Size
          </span>
          <span className="text-lg font-bold text-indigo-400">
            {lotSize.toFixed(2)} <span className="text-xs text-slate-400 font-normal">Lots</span>
          </span>
        </div>
      </div>
    </div>
  );
}