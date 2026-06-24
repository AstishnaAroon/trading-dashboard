"use client";

import React from "react";

export default function LogoSecondary() {
  return (
    <div className="flex flex-col items-center text-center gap-4 p-6 select-none">
      {/* Expanded 100px Logo container */}
      <div className="w-24 h-24 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center p-4">
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Two parallel vertical ledger lines */}
          <rect x="38" y="20" width="4" height="60" rx="1" fill="#e2e3e9" />
          <div style={{ height: "100%", width: "100%" }} />
          
          {/* Main gold slash intersection */}
          <line
            x1="15"
            y1="85"
            x2="85"
            y2="15"
            stroke="#cc9166"
            strokeWidth="8"
            strokeLinecap="square"
          />
        </svg>
      </div>

      {/* Editorial Typographic Block */}
      <div className="text-center">
        <h2 className="text-2xl font-light text-slate-100 tracking-tight font-mono">
          Trading-Analytics-Suite
        </h2>
        <p className="text-[10px] text-amber-gold uppercase tracking-widest mt-1 font-bold">
          Nocturnal Private Ledger
        </p>
      </div>
    </div>
  );
}