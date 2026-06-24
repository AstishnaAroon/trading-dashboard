"use client";

import React, { useEffect, useRef, memo } from "react";

function TradingViewChart() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentContainer = containerRef.current;
    if (!currentContainer) return;

    if (currentContainer.querySelector("script")) return;

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;

    // Configured to completely merge with the "Slash" Slate card container background! [DESIGN (5).md]
    script.innerHTML = JSON.stringify({
      "allow_symbol_change": true,
      "calendar": false,
      "details": true,
      "hide_side_toolbar": false,
      "hide_top_toolbar": false,
      "hide_legend": false,
      "hide_volume": false,
      "hotlist": true,
      "interval": "D",
      "locale": "en",
      "save_image": true,
      "style": "1",
      "symbol": "OANDA:XAUUSD",
      "theme": "dark",
      "timezone": "Etc/UTC",
      "backgroundColor": "#1c1d22", // Slate background [DESIGN (5).md]
      "gridColor": "#2e3038",       // Iron grid lines [DESIGN (5).md]
      "watchlist": [
        "OANDA:XAUUSD",
        "OANDA:EURUSD"
      ],
      "withdateranges": true,
      "range": "YTD",
      "compareSymbols": [],
      "show_popup_button": true,
      "popup_height": "650",
      "popup_width": "1000",
      "studies": [],
      "autosize": true
    });

    currentContainer.appendChild(script);

    return () => {};
  }, []);

  return (
    <div className="w-full bg-slate border border-iron rounded-[10px] overflow-hidden text-bone">
      {/* Header */}
      <div className="px-6 py-4 border-b border-iron bg-graphite/30 flex justify-between items-center shrink-0">
        <div>
          <h3 className="text-[14px] font-bold uppercase tracking-widest text-ash">Interactive Price Chart</h3>
          <p className="text-xs text-ash">Live multi-timeframe analysis powered by TradingView.</p>
        </div>
      </div>

      {/* Widget Container - 550px height matching the dashboard grid perfectly */}
      <div className="p-6 bg-inkwell h-[550px] w-full">
        <div 
          className="tradingview-widget-container" 
          ref={containerRef} 
          style={{ height: "100%", width: "100%" }}
        >
          <div 
            className="tradingview-widget-container__widget" 
            style={{ height: "calc(100% - 32px)", width: "100%" }}
          />
        </div>
      </div>
    </div>
  );
}

export default memo(TradingViewChart);