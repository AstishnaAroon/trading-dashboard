"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { supabase } from "../lib/supabaseClient";

interface Alert {
  id: string;
  pair: string;
  target_price: number;
  condition: "ABOVE" | "BELOW";
  is_triggered: boolean;
}

const PAIRS = ["EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD"];

export default function PriceAlerts() {
  const { user } = useUser();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [permission, setPermissionStatus] = useState<string>("default");

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

  // Fetch active alerts from Supabase
  const fetchAlerts = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("alerts")
      .select("id, pair, target_price, condition, is_triggered")
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

  // Background price watcher via WebSockets to trigger browser popups
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
    if (!apiKey || alerts.length === 0) return;

    const socket = new WebSocket(`wss://ws.finnhub.io?token=${apiKey}`);

    socket.addEventListener("open", () => {
      // Subscribe to active pairs that have alerts set
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

          // Convert OANDA format back to EUR/USD
          const pairName = tickSymbol.replace("OANDA:", "").replace("_", "/");

          // Check if any of our active alerts are triggered by this price tick
          for (const alert of alerts) {
            if (alert.pair === pairName && !alert.is_triggered) {
              const isHit =
                alert.condition === "ABOVE"
                  ? tickPrice >= alert.target_price
                  : tickPrice <= alert.target_price;

              if (isHit) {
                // 1. Instantly trigger native browser notification popup
                if (Notification.permission === "granted") {
                  new Notification(`🚨 Price Alert Hit!`, {
                    body: `${alert.pair} is now ${alert.condition.toLowerCase()} your target of ${alert.target_price}! Current: ${tickPrice}`,
                    icon: "/favicon.ico", // Standard tab favicon
                  });
                }

                // 2. Mark as triggered in local UI state immediately to prevent loop
                setAlerts((prev) => prev.filter((a) => a.id !== alert.id));

                // 3. Mark as triggered in Supabase permanently
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
  }, [alerts]); // Re-connect WebSocket if our alert list changes

  return (
    <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6 text-white">
      <h2 className="text-xl font-bold mb-1 tracking-tight">Desktop Price Alerts</h2>
      <p className="text-slate-400 text-xs mb-6">Receive real-time desktop popups when price targets are crossed.</p>

      {/* 1. Request Permission Banner */}
      {permission !== "granted" && (
        <div className="bg-amber-950/30 border border-amber-800/50 p-4 rounded-xl mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-amber-400 text-center sm:text-left">
            Enable desktop permissions to receive notifications when you are in other browser tabs.
          </p>
          <button
            onClick={requestPermission}
            className="whitespace-nowrap bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs py-2 px-4 rounded-lg transition"
          >
            Enable Notifications
          </button>
        </div>
      )}

      {/* 2. Create Alert Form */}
      <form onSubmit={handleCreateAlert} className="space-y-4 border-b border-slate-800 pb-6 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Instrument
            </label>
            <select
              value={pair}
              onChange={(e) => setPair(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-sm"
            >
              {PAIRS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Condition
            </label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value as "ABOVE" | "BELOW")}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-sm"
            >
              <option value="ABOVE">Price Goes ABOVE</option>
              <option value="BELOW">Price Goes BELOW</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Target Price
          </label>
          <div className="flex gap-3">
            <input
              type="number"
              step="0.00001"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              placeholder="e.g. 1.09250"
              className="flex-grow bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-3 text-sm"
              required
            />
            <button
              type="submit"
              disabled={loading || permission !== "granted"}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium px-6 py-3 rounded-xl text-sm transition"
            >
              {loading ? "Saving..." : "Set Alert"}
            </button>
          </div>
        </div>
      </form>

      {/* 3. Active Alerts List */}
      <div>
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Active Alerts ({alerts.length})
        </h4>

        {alerts.length === 0 ? (
          <p className="text-slate-500 text-xs py-4 text-center">No active alerts running. Set one above!</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between bg-slate-950 border border-slate-800/40 p-3.5 rounded-xl text-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-200">{alert.pair}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    alert.condition === "ABOVE" ? "bg-emerald-950/50 text-emerald-400" : "bg-rose-950/50 text-rose-400"
                  }`}>
                    {alert.condition}
                  </span>
                  <span className="font-mono text-slate-300 font-semibold">{alert.target_price}</span>
                </div>
                <button
                  onClick={() => handleDeleteAlert(alert.id)}
                  className="text-xs text-slate-500 hover:text-red-400 font-bold transition px-2"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}