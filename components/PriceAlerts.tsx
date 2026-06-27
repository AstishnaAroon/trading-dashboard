"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { supabase } from "../lib/supabaseClient";

interface Alert {
  id: string;
  email: string;
  pair: string;
  target_price: number;
  condition: "ABOVE" | "BELOW";
  is_triggered: boolean;
}

const PAIRS = ["EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD"];
const CONDITIONS = ["ABOVE", "BELOW"];

export default function PriceAlerts() {
  const { user } = useUser();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [permission, setPermissionStatus] = useState<string>("default");

  // Single active dropdown controller (prevents multiple open dropdowns)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Form states
  const [pair, setPair] = useState<string>("EUR/USD");
  const [targetPrice, setTargetPrice] = useState<string>("");
  const [condition, setCondition] = useState<"ABOVE" | "BELOW">("ABOVE");
  const [loading, setLoading] = useState<boolean>(false);

  // Check current browser notification permission on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  // Request browser permission for desktop notifications
  const requestPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      alert("This browser does not support desktop notifications.");
      return;
    }
    const res = await Notification.requestPermission();
    setPermissionStatus(res);
  };

  // Fetch active alerts from Supabase (Including the email column)
  const fetchAlerts = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("alerts")
      .select("id, email, pair, target_price, condition, is_triggered")
      .eq("user_id", user.id)
      .eq("is_triggered", false);

    if (!error) {
      setAlerts(data || []);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAlerts();
    }
  }, [user]);

  // Create a new price alert
  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const priceNum = parseFloat(targetPrice);
    if (!priceNum || priceNum <= 0) return;

    setLoading(true);

    const newAlert = {
      user_id: user.id,
      email: user.primaryEmailAddress?.emailAddress || "",
      pair,
      target_price: priceNum,
      condition,
      is_triggered: false,
    };

    const { error } = await supabase.from("alerts").insert([newAlert]);

    setLoading(false);
    if (!error) {
      setTargetPrice("");
      fetchAlerts();
    }
  };

  // Delete an alert
  const handleDeleteAlert = async (id: string) => {
    const { error } = await supabase.from("alerts").delete().eq("id", id);
    if (!error) {
      fetchAlerts();
    }
  };

  // Background price watcher via WebSockets to trigger browser popups & emails
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
    if (!apiKey || alerts.length === 0) return;

    const socket = new WebSocket(`wss://ws.finnhub.io?token=${apiKey}`);

    socket.addEventListener("open", () => {
      const uniquePairs = Array.from(new Set(alerts.map((a) => a.pair)));
      uniquePairs.forEach((p) => {
        const symbol = `OANDA:${p.replace("/", "_")}`;
        socket.send(JSON.stringify({ type: "subscribe", symbol }));
      });
    });

    socket.addEventListener("message", async (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.type === "trade" && parsed.data) {
          const tick = parsed.data[0];
          const tickSymbol = tick.s; // OANDA:EUR_USD
          const tickPrice = tick.p;

          const pairName = tickSymbol.replace("OANDA:", "").replace("_", "/");

          for (const alert of alerts) {
            if (alert.pair === pairName && !alert.is_triggered) {
              const isHit =
                alert.condition === "ABOVE"
                  ? tickPrice >= alert.target_price
                  : tickPrice <= alert.target_price;

              if (isHit) {
                if (Notification.permission === "granted") {
                  new Notification(`🚨 Price Alert Hit!`, {
                    body: `${alert.pair} is now ${alert.condition.toLowerCase()} your target of ${alert.target_price}! Current: ${tickPrice}`,
                    icon: "/favicon.ico",
                  });
                }

                if (alert.email) {
                  fetch("/api/send-alert", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      email: alert.email,
                      pair: alert.pair,
                      targetPrice: alert.target_price,
                      condition: alert.condition,
                    }),
                  }).catch((err) => console.error("Error sending live trigger email:", err));
                }

                setAlerts((prev) => prev.filter((a) => a.id !== alert.id));

                await supabase
                  .from("alerts")
                  .update({ is_triggered: true })
                  .eq("id", alert.id);
              }
            }
          }
        }
      } catch (err) {
        console.error("Error watching prices for alerts:", err);
      }
    });

    return () => {
      socket.close();
    };
  }, [alerts]);

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
    <div className="w-full bg-slate border border-iron rounded-[10px] p-6 text-bone relative">
      {/* Title - "notifications_active" text icon completely removed [DESIGN (5).md] */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[14px] font-bold uppercase tracking-widest text-ash">Price Alerts</h3>
      </div>

      {/* Global transparent click-shield to close any active custom dropdowns */}
      {activeDropdown && (
        <div
          className="fixed inset-0 z-30 bg-transparent cursor-default"
          onClick={() => setActiveDropdown(null)}
        />
      )}

      {/* 1. Request Permission Banner */}
      {permission !== "granted" && (
        <div className="bg-graphite border border-ember-gold/30 p-4 rounded-sm mb-6 flex flex-col items-center justify-between gap-4">
          <p className="text-xs text-ember-gold text-center">
            Enable desktop permissions to receive notifications when you are in other browser tabs.
          </p>
          <button
            onClick={requestPermission}
            className="w-full bg-transparent border border-ash text-bone hover:border-bone font-bold text-xs py-2 px-4 rounded-sm transition-all duration-200 cursor-pointer uppercase tracking-wider"
          >
            Enable Notifications
          </button>
        </div>
      )}

      {/* 2. Create Alert Form */}
      <form onSubmit={handleCreateAlert} className="space-y-4 border-b border-iron pb-6 mb-6">
        <div className="grid grid-cols-2 gap-4">
          {/* Pair Custom Select */}
          <div className="relative">
            <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">Instrument</label>
            <div
              onClick={() => setActiveDropdown(activeDropdown === "pair" ? null : "pair")}
              className="w-full bg-graphite border border-iron text-bone text-[14px] px-3 py-2 rounded-sm flex items-center justify-between cursor-pointer select-none"
            >
              <span className="font-semibold">{pair}</span>
              <CaretIcon />
            </div>
            {activeDropdown === "pair" && (
              <div className="absolute left-0 right-0 mt-1 bg-inkwell border border-iron rounded-sm shadow-2xl z-40 max-h-48 overflow-y-auto divide-y divide-iron/20">
                {PAIRS.map((p) => (
                  <div
                    key={p}
                    onClick={() => {
                      setPair(p);
                      setActiveDropdown(null);
                    }}
                    className={`px-4 py-2.5 text-xs text-bone hover:bg-slate cursor-pointer ${pair === p ? "bg-graphite font-bold" : ""}`}
                  >
                    {p}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Condition Custom Select */}
          <div className="relative">
            <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">Condition</label>
            <div
              onClick={() => setActiveDropdown(activeDropdown === "condition" ? null : "condition")}
              className="w-full bg-graphite border border-iron text-bone text-[14px] px-3 py-2 rounded-sm flex items-center justify-between cursor-pointer select-none"
            >
              <span className="font-semibold">{condition === "ABOVE" ? "PRICE GOES ABOVE" : "PRICE GOES BELOW"}</span>
              <CaretIcon />
            </div>
            {activeDropdown === "condition" && (
              <div className="absolute left-0 right-0 mt-1 bg-inkwell border border-iron rounded-sm shadow-2xl z-40">
                <div
                  onClick={() => {
                    setCondition("ABOVE");
                    setActiveDropdown(null);
                  }}
                  className={`px-4 py-2.5 text-xs text-bone hover:bg-slate cursor-pointer ${condition === "ABOVE" ? "bg-graphite font-bold" : ""}`}
                >
                  PRICE GOES ABOVE
                </div>
                <div
                  onClick={() => {
                    setCondition("BELOW");
                    setActiveDropdown(null);
                  }}
                  className={`px-4 py-2.5 text-xs text-bone hover:bg-slate cursor-pointer ${condition === "BELOW" ? "bg-graphite font-bold" : ""}`}
                >
                  PRICE GOES BELOW
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">
            Target Price
          </label>
          <div className="flex gap-3">
            <input
              type="number"
              step="0.00001"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              onBlur={() => cleanInputOnBlur(targetPrice, setTargetPrice, "")}
              placeholder="e.g. 1.09250"
              className="flex-grow bg-graphite border border-iron rounded-sm px-4 py-2 text-sm text-bone focus:border-ember-gold focus:ring-0 outline-none tabular-nums"
              required
            />
            <button
              type="submit"
              disabled={loading || permission !== "granted"}
              className="bg-white text-inkwell hover:bg-bone disabled:bg-graphite disabled:text-ash font-bold px-6 py-2 rounded-sm text-xs transition-colors duration-200 cursor-pointer uppercase tracking-wider h-[38px] shrink-0"
            >
              {loading ? "..." : "Set Alert"}
            </button>
          </div>
        </div>
      </form>

      {/* 3. Active Alerts List */}
      <div>
        <h4 className="text-[11px] font-bold text-ash uppercase tracking-wider mb-3">
          Active Alerts ({alerts.length})
        </h4>

        {alerts.length === 0 ? (
          <p className="text-ash text-xs py-4 text-center uppercase tracking-widest">No active alerts running.</p>
        ) : (
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1 divide-y divide-iron/30 scrollbar-none">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between py-3 text-sm"
              >
                <div className="flex items-center gap-4">
                  <span className="font-bold text-bone text-[15px]">{alert.pair}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    alert.condition === "ABOVE" 
                      ? "bg-graphite border border-iron text-bone" 
                      : "bg-graphite border border-iron text-ember-gold"
                  }`}>
                    {alert.condition}
                  </span>
                  <span className="font-mono text-bone font-medium tabular-nums">{alert.target_price}</span>
                </div>
                <button
                  onClick={() => handleDeleteAlert(alert.id)}
                  className="text-xs text-ash hover:text-ember-gold font-bold transition-colors cursor-pointer"
                >
                  DELETE
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}