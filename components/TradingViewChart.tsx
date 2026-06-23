"use client";

import React, { useEffect, useRef, memo } from "react";

function TradingViewChart() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentContainer = containerRef.current;
    if (!currentContainer) return;

    // 1. Clear container first to prevent duplicate charts during hot-reloads/strict-mode
    currentContainer.innerHTML = "";

    // 2. Create the script element
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;

    // 3. Inject your exact configurations (styled to match our dark slate dashboard)
    script.innerHTML = `
      {
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
        "backgroundColor": "#0f172a",
        "gridColor": "rgba(30, 41, 59, 0.5)",
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
      }`;

    // 4. Append the script
    currentContainer.appendChild(script);

    // 5. Cleanup on unmount
    return () => {
      if (currentContainer) {
        currentContainer.innerHTML = "";
      }
    };
  }, []);

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden text-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800">
        <h3 className="font-bold text-base">Interactive Price Chart</h3>
        <p className="text-xs text-slate-400">Advanced multi-timeframe analysis powered by TradingView.</p>
      </div>

      {/* Widget Container - Height increased to 550px to comfortably fit the chart, watchlist, and details */}
      <div className="p-6 bg-slate-950">
        <div 
          className="tradingview-widget-container" 
          ref={containerRef} 
          style={{ height: "550px", width: "100%" }}
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