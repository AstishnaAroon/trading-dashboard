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

    const socket = new WebSocket(`wss://ws.finnhub.io?token=${apiKey}`);

    socket.addEventListener("open", () => {
      setConnected(true);
      Object.keys(SYMBOL_MAP).forEach((symbol) => {
        socket.send(JSON.stringify({ type: "subscribe", symbol }));
      });
    });

    socket.addEventListener("message", (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.type === "trade" && parsed.data) {
          const tick = parsed.data[0];
          const pairName = SYMBOL_MAP[tick.s];

          if (pairName) {
            setPrices((prev) => {
              const currentPair = prev[pairName];
              if (currentPair.current === tick.p) return prev;
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

    socket.addEventListener("close", () => {
      setConnected(false);
    });

    return () => {
      socket.close();
    };
  }, []);

  const getPriceColor = (price: PriceState) => {
    if (price.current > price.prev) return "text-bone";       // Primary positive delta [DESIGN (5).md]
    if (price.current < price.prev) return "text-ember-gold"; // Drawdown delta [DESIGN (5).md]
    return "text-bone";
  };

  return (
    <div className="flex items-center gap-6 overflow-x-auto select-none py-1 scrollbar-none w-full max-w-full">
      {/* Tiny active session pulsing indicator */}
      <div className="flex items-center gap-2 shrink-0">
        <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-ember-gold animate-pulse" : "bg-ash"}`} />
        <span className="text-[10px] uppercase tracking-widest text-ash font-bold">
          {connected ? "Live Feed" : "Offline"}
        </span>
      </div>

      {/* Ribbon Ticker Feed */}
      <div className="flex items-center gap-4">
        {Object.keys(prices).map((pair) => {
          const price = prices[pair];
          const colorClass = getPriceColor(price);

          return (
            <div key={pair} className="flex items-center gap-3 bg-graphite border border-iron px-3 py-1 rounded-sm shrink-0">
              <span className="text-[11px] font-bold text-ash">{pair}</span>
              <span className={`tabular-nums text-[13px] font-mono font-medium ${colorClass}`}>
                {price.current.toLocaleString(undefined, {
                  minimumFractionDigits: pair.includes("JPY") ? 2 : 4,
                  maximumFractionDigits: pair.includes("JPY") ? 3 : 5,
                })}
              </span>
              <span className={`text-[11px] font-mono ${price.current >= price.prev ? "text-bone" : "text-ember-gold"}`}>
                {price.current >= price.prev ? "▲" : "▼"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}