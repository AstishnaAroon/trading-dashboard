"use client";

import React, { useEffect, useState } from "react";

// Map Finnhub OANDA symbols to standard display names
const SYMBOL_MAP: { [key: string]: string } = {
  "OANDA:EUR_USD": "EUR/USD",
  "OANDA:GBP_USD": "GBP/USD",
  "OANDA:USD_JPY": "USD/JPY",
  "OANDA:AUD_USD": "AUD/USD",
};

interface PriceState {
  current: number;
  prev: number;
}

export default function LiveTicker() {
  const [prices, setPrices] = useState<{ [key: string]: PriceState }>({
    "EUR/USD": { current: 1.0850, prev: 1.0850 },
    "GBP/USD": { current: 1.2740, prev: 1.2740 },
    "USD/JPY": { current: 157.50, prev: 157.50 },
    "AUD/USD": { current: 0.6650, prev: 0.6650 },
  });

  const [connected, setConnected] = useState<boolean>(false);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
    if (!apiKey) {
      console.warn("Finnhub API Key is missing. Ticker running in demo mode.");
      return;
    }

    // 1. Open a direct WebSocket connection to Finnhub
    const socket = new WebSocket(`wss://ws.finnhub.io?token=${apiKey}`);

    // 2. When the connection opens, subscribe to our 4 currency pairs
    socket.addEventListener("open", () => {
      setConnected(true);
      Object.keys(SYMBOL_MAP).forEach((symbol) => {
        socket.send(JSON.stringify({ type: "subscribe", symbol }));
      });
    });

    // 3. Listen for live price tick messages
    socket.addEventListener("message", (event) => {
      try {
        const parsed = JSON.parse(event.data);
        
        // Finnhub pushes price updates as 'trade' messages
        if (parsed.type === "trade" && parsed.data) {
          const tick = parsed.data[0]; // Get the latest price tick
          const pairName = SYMBOL_MAP[tick.s];

          if (pairName) {
            setPrices((prev) => {
              const currentPair = prev[pairName];
              if (currentPair.current === tick.p) return prev; // If price hasn't changed, do nothing

              // Update current price and store previous price to calculate tick direction
              return {
                ...prev,
                [pairName]: {
                  current: tick.p,
                  prev: currentPair.current,
                },
              };
            });
          }
        }
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
    });

    // 4. Handle connection closing
    socket.addEventListener("close", () => {
      setConnected(false);
    });

    // 5. Clean up: close the WebSocket connection when the component unmounts
    return () => {
      socket.close();
    };
  }, []);

  // Determine the CSS color based on tick direction
  const getPriceColor = (price: PriceState) => {
    if (price.current > price.prev) return "text-emerald-400";
    if (price.current < price.prev) return "text-rose-500";
    return "text-slate-200";
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-md">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          {connected ? "Live Forex Market Feed" : "Connecting to Market Feed..."}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        {Object.keys(prices).map((pair) => {
          const price = prices[pair];
          const colorClass = getPriceColor(price);

          return (
            <div key={pair} className="flex items-center gap-2 bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-800/40">
              <span className="text-xs font-bold text-slate-400">{pair}</span>
              <span className={`text-sm font-black font-mono transition-colors duration-300 ${colorClass}`}>
                {price.current.toLocaleString(undefined, {
                  minimumFractionDigits: pair.includes("JPY") ? 2 : 4,
                  maximumFractionDigits: pair.includes("JPY") ? 3 : 5,
                })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}