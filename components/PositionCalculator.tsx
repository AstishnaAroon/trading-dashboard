"use client";

import React, { useState } from "react";

// Precise Pip Value Mapping per Standard Lot (100,000 units) [DESIGN (5).md]
const INSTRUMENT_MAP: { [key: string]: number } = {
  "EUR/USD": 10.0,       // Major USD quote pairs: $10.00/pip
  "GBP/USD": 10.0,
  "AUD/USD": 10.0,
  "USD/JPY": 9.2,        // JPY average rate: ~$9.20/pip
  "EUR/JPY": 9.2,
  "GBP/JPY": 9.2,
  "XAU/USD (Gold)": 10.0, // Gold contract size: $10.00/point/pip
};

export default function PositionCalculator() {
  // Input states (customPipValue successfully declared!) [DESIGN (5).md]
  const [balance, setBalance] = useState<string>("125000");
  const [riskPercent, setRiskPercent] = useState<string>("1.0");
  const [stopLoss, setStopLoss] = useState<string>("15.0");
  const [instrument, setInstrument] = useState<string>("EUR/USD");
  const [customPipValue, setCustomPipValue] = useState<string>("10"); 
  
  // Custom dropdown open state
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  // Input sanitizer: Cleans leading zeroes on blur (e.g. 02.323 -> 2.323) [DESIGN (5).md]
  const cleanInputOnBlur = (value: string, setter: (val: string) => void, fallback = "0") => {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) {
      setter(fallback);
    } else {
      // Convert back to string and force positive value to prevent negative calculations
      setter(Math.abs(parsed).toString());
    }
  };

  // Convert inputs to absolute positive numbers to protect calculations
  const balanceNum = Math.abs(parseFloat(balance)) || 0;
  const riskPercentNum = Math.abs(parseFloat(riskPercent)) || 0;
  const stopLossNum = Math.abs(parseFloat(stopLoss)) || 0;
  
  // Fetch pip value from our mapped instrument list [DESIGN (5).md]
  const pipValueNum = instrument === "custom" 
    ? (parseFloat(customPipValue) || 10.0) 
    : (INSTRUMENT_MAP[instrument] || 10.0);

  // Mathematical Calculations
  const riskAmount = balanceNum * (riskPercentNum / 100);
  
  // Safe calculation to prevent dividing by zero
  const standardLots = stopLossNum > 0 && pipValueNum > 0 
    ? riskAmount / (stopLossNum * pipValueNum) 
    : 0;

  const positionUnits = standardLots * 100000;
  const miniLots = standardLots * 10;
  const microLots = standardLots * 100;

  return (
    <div className="w-full bg-slate border border-iron rounded-[10px] p-6 text-bone relative">
      {/* Card Title */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[14px] font-bold uppercase tracking-widest text-ash">Position Calculator</h3>
      </div>

      <div className="space-y-4">
        {/* Row 1: Risk % & Stop Loss */}
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
              onBlur={() => cleanInputOnBlur(riskPercent, setRiskPercent, "1.0")}
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
              step="0.1"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              onBlur={() => cleanInputOnBlur(stopLoss, setStopLoss, "15.0")}
              placeholder="15.0"
              className="w-full bg-graphite border border-iron text-bone text-[14px] px-3 py-2 rounded-sm focus:border-ember-gold focus:ring-0 outline-none tabular-nums"
            />
          </div>
        </div>

        {/* Row 2: Account Balance */}
        <div>
          <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">
            Account Balance ($)
          </label>
          <input
            type="number"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            onBlur={() => cleanInputOnBlur(balance, setBalance, "10000")}
            placeholder="125,000.00"
            className="w-full bg-graphite border border-iron text-bone text-[14px] px-3 py-2 rounded-sm focus:border-ember-gold focus:ring-0 outline-none tabular-nums"
          />
        </div>

        {/* Row 3: Custom Premium Dropdown Selector [DESIGN (5).md] */}
        <div className="relative">
          <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">
            Instrument
          </label>
          {/* Selected Trigger */}
          <div
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full bg-graphite border border-iron text-bone text-[14px] px-3 py-2 rounded-sm focus:border-ember-gold focus:ring-0 outline-none flex items-center justify-between cursor-pointer select-none"
          >
            <span className="font-medium">{instrument}</span>
            {/* Minimal Gold Caret SVG */}
            <svg
              width="10"
              height="6"
              viewBox="0 0 10 6"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={`transform transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
            >
              <path d="M1 1L5 5L9 1" stroke="#cc9166" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Full Screen Transparent Click-Shield to Close Dropdown */}
          {isDropdownOpen && (
            <div
              className="fixed inset-0 z-30 bg-transparent cursor-default"
              onClick={() => setIsDropdownOpen(false)}
            />
          )}

          {/* Options Dropdown Overlay */}
          {isDropdownOpen && (
            <div className="absolute left-0 right-0 mt-1 bg-inkwell border border-iron rounded-sm shadow-2xl z-40 max-h-60 overflow-y-auto divide-y divide-iron/20">
              {Object.keys(INSTRUMENT_MAP).map((pair) => (
                <div
                  key={pair}
                  onClick={() => {
                    setInstrument(pair);
                    setIsDropdownOpen(false);
                  }}
                  className={`px-4 py-2.5 text-sm text-bone hover:bg-slate cursor-pointer transition-colors duration-150 ${
                    instrument === pair ? "bg-graphite text-white font-bold" : ""
                  }`}
                >
                  {pair}
                </div>
              ))}
              <div
                onClick={() => {
                  setInstrument("custom");
                  setIsDropdownOpen(false);
                }}
                className={`px-4 py-2.5 text-sm text-bone hover:bg-slate cursor-pointer transition-colors duration-150 ${
                  instrument === "custom" ? "bg-graphite text-white font-bold" : ""
                }`}
              >
                Custom Pip Value
              </div>
            </div>
          )}
        </div>

        {/* Custom Pip Value Input (Shows only if "custom" is selected) [DESIGN (5).md] */}
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
              onBlur={() => cleanInputOnBlur(customPipValue, setCustomPipValue, "10")}
              placeholder="10"
              className="w-full bg-graphite border border-iron text-bone text-[14px] px-3 py-2 rounded-sm focus:border-ember-gold focus:ring-0 outline-none tabular-nums"
            />
          </div>
        )}

        {/* Results Panel: Upgraded with 4-decimal precision on all lot sizes [DESIGN (5).md] */}
        <div className="pt-6 border-t border-iron mt-6 space-y-3">
          
          {/* Standard Lots - HIGHLY HIGHLIGHTED [DESIGN (5).md] */}
          <div className="bg-inkwell p-4 rounded-sm border-2 border-ember-gold flex items-center justify-between">
            <span className="text-[11px] font-bold text-ash uppercase tracking-widest">
              Standard Lots (Primary)
            </span>
            <span className="text-2xl font-black text-white tabular-nums select-all hover:text-ember-gold transition-colors duration-200" title={standardLots.toFixed(4)}>
              {standardLots.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-inkwell p-3 rounded-sm border border-iron text-center">
              <p className="text-[10px] text-ash mb-1 uppercase font-bold">Mini Lots</p>
              <p className="text-[15px] font-bold text-bone tabular-nums" title={miniLots.toFixed(4)}>
                {miniLots.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
              </p>
            </div>

            <div className="bg-inkwell p-3 rounded-sm border border-iron text-center">
              <p className="text-[10px] text-ash mb-1 uppercase font-bold">Micro Lots</p>
              <p className="text-[15px] font-bold text-bone tabular-nums" title={microLots.toFixed(4)}>
                {microLots.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-inkwell p-3 rounded-sm border border-iron text-center">
              <p className="text-[10px] text-ash mb-1 uppercase font-bold">Position Units</p>
              <p className="text-[14px] font-bold text-bone tabular-nums truncate max-w-[140px]" title={positionUnits.toLocaleString()}>
                {positionUnits.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>

            <div className="bg-inkwell p-3 rounded-sm border border-iron text-center">
              <p className="text-[10px] text-ash mb-1 uppercase font-bold">Amount at Risk</p>
              <p className="text-[14px] font-bold text-bone tabular-nums truncate max-w-[140px]" title={`$${riskAmount.toLocaleString()}`}>
                ${riskAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}