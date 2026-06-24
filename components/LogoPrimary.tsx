import React from "react";

export default function LogoPrimary() {
  return (
    <div className="flex items-center gap-3.5 select-none h-8">
      {/* 1. Infinite-resolution SVG Monogram Symbol */}
      <svg
        width="28"
        height="28"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Two parallel vertical lines in Bone-White */}
        <rect x="35" y="15" width="3" height="70" fill="#e2e3e9" rx="1" />
        <rect x="47" y="15" width="3" height="70" fill="#e2e3e9" rx="1" />
        
        {/* The razor-sharp diagonal Golden Slash */}
        <line
          x1="20"
          y1="72"
          x2="80"
          y2="28"
          stroke="#cc9166"
          strokeWidth="8"
          strokeLinecap="square"
        />
      </svg>

      {/* 2. Typographic Wordmark (The Broadsheet Font Tension) */}
      <div className="flex items-baseline font-inter tracking-tight leading-none text-sm select-none">
        <span className="font-extrabold text-white uppercase mr-1">
          Trading
        </span>
        <span className="font-serif italic font-medium text-amber-gold text-base mr-1.5" style={{ fontFamily: 'Georgia, serif' }}>
          Analytics
        </span>
        <span className="font-normal text-slate-400 uppercase text-xs">
          Suite
        </span>
      </div>
    </div>
  );
}