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

export default function PriceAlerts() {
  const { user } = useUser();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [permission, setPermissionStatus] = useState<string>("default");

  const [pair, setPair] = useState<string>("EUR/USD");
  const [targetPrice, setTargetPrice] = useState<string>("");
  const [condition, setCondition] = useState<"ABOVE" | "BELOW">("ABOVE");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      alert("This browser does not support desktop notifications.");
      return;
    }
    const res = await Notification.requestPermission();
    setPermissionStatus(res);
  };

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

  const handleDeleteAlert = async (id: string) => {
    const { error } = await supabase.from("alerts").delete().eq("id", id);
    if (!error) {
      fetchAlerts();
    }
  };

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
          const tickSymbol = tick.s;
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

  return (
    <div className="w-full bg-slate border border-iron rounded-[10px] p-6 text-bone">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[14px] font-bold uppercase tracking-widest text-ash">Price Alerts</h3>
        <span className="material-symbols-outlined text-ash text-[18px]">notifications_active</span>
      </div>

      {/* 1. Request Permission Banner - Styled as a Graphite and Gold box [DESIGN (5).md] */}
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
          <div>
            <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">
              Instrument
            </label>
            <select
              value={pair}
              onChange={(e) => setPair(e.target.value)}
              className="w-full bg-graphite border border-iron rounded-sm px-3 py-2 text-sm text-bone focus:border-ember-gold focus:ring-0 outline-none appearance-none"
            >
              {PAIRS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-ash mb-1.5 uppercase font-bold">
              Condition
            </label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value as "ABOVE" | "BELOW")}
              className="w-full bg-graphite border border-iron rounded-sm px-3 py-2 text-sm text-bone focus:border-ember-gold focus:ring-0 outline-none appearance-none"
            >
              <option value="ABOVE">Price Goes ABOVE</option>
              <option value="BELOW">Price Goes BELOW</option>
            </select>
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
              placeholder="e.g. 1.09250"
              className="flex-grow bg-graphite border border-iron rounded-sm px-4 py-2 text-sm text-bone focus:border-ember-gold focus:ring-0 outline-none tabular-nums"
              required
            />
            <button
              type="submit"
              disabled={loading || permission !== "granted"}
              className="bg-white text-inkwell hover:bg-bone disabled:bg-graphite disabled:text-ash font-bold px-6 py-2 rounded-sm text-xs transition-colors duration-200 cursor-pointer uppercase tracking-wider"
            >
              {loading ? "..." : "Set Alert"}
            </button>
          </div>
        </div>
      </form>

      {/* 3. Active Alerts List - Styled like our compact Transaction Rows [DESIGN (5).md] */}
      <div>
        <h4 className="text-[11px] font-bold text-ash uppercase tracking-wider mb-3">
          Active Alerts ({alerts.length})
        </h4>

        {alerts.length === 0 ? (
          <p className="text-ash text-xs py-4 text-center uppercase tracking-widest">No active alerts running.</p>
        ) : (
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1 divide-y divide-iron/30">
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