"use client";

import React, { useState } from "react";

export default function PositionCalculator() {
  const [balance, setBalance] = useState<string>("125000");
  const [riskPercent, setRiskPercent] = useState<string>("1.0");
  const [stopLoss, setStopLoss] = useState<string>("15.0");
  const [instrument, setInstrument] = useState<string>("standard");
  const [customPipValue, setCustomPipValue] = useState<string>("10");

  const getPipValue = (): number => {
    if (instrument === "standard") return 10;
    if (instrument === "jpy") return 9.2;
    return parseFloat(customPipValue) || 10;
  };

  const balanceNum = parseFloat(balance) || 0;
  const riskPercentNum = parseFloat(riskPercent) || 0;
  const stopLossNum = parseFloat(stopLoss) || 0;
  const pipValueNum = getPipValue();

  const riskAmount = balanceNum * (riskPercentNum / 100);
  
  const lotSize = stopLossNum > 0 && pipValueNum > 0 
    ? riskAmount / (stopLossNum * pipValueNum) 
    : 0;

  return (
    <div className="w-full bg-slate border border-iron rounded-[10px] p-6 text-bone">
      {/* Title */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[14px] font-bold uppercase tracking-widest text-ash">Position Calculator</h3>
        <span className="material-symbols-outlined text-ash text-[18px]">calculate</span>
      </div>

      <div className="space-y-4">
        {/* Row for Risk % and Stop Loss */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">
              Risk (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={riskPercent}
              onChange={(e) => setRiskPercent(e.target.value)}
              placeholder="1.0"
              className="w-full bg-graphite border border-iron text-bone text-[14px] px-3 py-2 rounded-sm focus:border-ember-gold focus:ring-0 outline-none tabular-nums"
            />
          </div>

          <div>
            <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">
              Stop Loss (Pips)
            </label>
            <input
              type="number"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              placeholder="15.0"
              className="w-full bg-graphite border border-iron text-bone text-[14px] px-3 py-2 rounded-sm focus:border-ember-gold focus:ring-0 outline-none tabular-nums"
            />
          </div>
        </div>

        {/* Account Balance */}
        <div>
          <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">
            Account Balance ($)
          </label>
          <input
            type="number"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            placeholder="125,000.00"
            className="w-full bg-graphite border border-iron text-bone text-[14px] px-3 py-2 rounded-sm focus:border-ember-gold focus:ring-0 outline-none tabular-nums"
          />
        </div>

        {/* Instrument Dropdown */}
        <div>
          <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">
            Instrument Type
          </label>
          <select
            value={instrument}
            onChange={(e) => setInstrument(e.target.value)}
            className="w-full bg-graphite border border-iron text-bone text-[14px] px-3 py-2 rounded-sm focus:border-ember-gold focus:ring-0 outline-none appearance-none"
          >
            <option value="standard">Standard Pairs ($10/pip per lot)</option>
            <option value="jpy">JPY Pairs (~$9.20/pip per lot)</option>
            <option value="custom">Custom Pip Value</option>
          </select>
        </div>

        {/* Custom Pip Value */}
        {instrument === "custom" && (
          <div>
            <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">
              Custom Pip Value ($ per standard lot)
            </label>
            <input
              type="number"
              step="0.1"
              value={customPipValue}
              onChange={(e) => setCustomPipValue(e.target.value)}
              placeholder="10"
              className="w-full bg-graphite border border-iron text-bone text-[14px] px-3 py-2 rounded-sm focus:border-ember-gold focus:ring-0 outline-none tabular-nums"
            />
          </div>
        )}

        {/* Results Panel */}
        <div className="pt-4 border-t border-iron mt-6 grid grid-cols-2 gap-3">
          <div className="bg-inkwell p-3 rounded-sm border border-iron text-center">
            <p className="text-[10px] text-ash mb-1 uppercase font-bold">Lot Size</p>
            <p className="text-[20px] font-bold text-ember-gold tabular-nums">
              {lotSize.toFixed(2)}
            </p>
          </div>

          <div className="bg-inkwell p-3 rounded-sm border border-iron text-center">
            <p className="text-[10px] text-ash mb-1 uppercase font-bold">At Risk ($)</p>
            <p className="text-[20px] font-bold text-ember-gold tabular-nums">
              {riskAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}