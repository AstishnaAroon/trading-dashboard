"use client";

import React, { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import LogoPrimary from "../../components/LogoPrimary";

interface FeedbackItem {
  id: string;
  email: string;
  message: string;
  status: "NEW" | "RESOLVED";
  created_at: string;
}

export default function AdminPanel() {
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Platform Analytics States
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [totalTrades, setTotalTrades] = useState<number>(0);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  // Authenticate against the custom password wall [3]
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "QUANT-PRO-26") {
      setIsAuthorized(true);
      setErrorMsg("");
      fetchAdminData();
    } else {
      setErrorMsg("INVALID DECRYPT KEY. ACCESS DENIED.");
      setPassword("");
    }
  };

  // Fetch admin diagnostics and user feedback lists [3]
  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // 1. Fetch total trades logged across the entire platform
      const { count: tradeCount, error: tradeError } = await supabase
        .from("trades")
        .select("id", { count: "exact", head: true });

      // 2. Fetch all feedback messages logged by users [3]
      const { data: feedbackData, error: feedbackError } = await supabase
        .from("feedback")
        .select("*")
        .order("created_at", { ascending: false });

      if (tradeError) throw tradeError;
      if (feedbackError) throw feedbackError;

      // Calculate unique active users by querying unique user_ids from trades
      const { data: uniqueUsers, error: userError } = await supabase
        .from("trades")
        .select("user_id");
      
      if (!userError && uniqueUsers) {
        const uniqueIds = new Set(uniqueUsers.map((u) => u.user_id));
        setTotalUsers(uniqueIds.size);
      }

      setTotalTrades(tradeCount || 0);
      setFeedback(feedbackData || []);
    } catch (err: any) {
      console.error("Admin data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Delete/Resolve a feedback entry from the database [3]
  const handleDeleteFeedback = async (id: string) => {
    const confirmDelete = window.confirm("Are you sure you want to remove this feedback from the ledger?");
    if (!confirmDelete) return;

    const { error } = await supabase.from("feedback").delete().eq("id", id);
    if (!error) {
      setFeedback((prev) => prev.filter((item) => item.id !== id));
    } else {
      alert("Failed to delete: " + error.message);
    }
  };

  // 1. Render Password Wall if not authorized [3]
  if (!isAuthorized) {
    return (
      <main className="min-h-screen bg-obsidian flex flex-col items-center justify-center p-6 select-none font-sans">
        <div className="max-w-md w-full bg-slate border border-iron p-8 rounded-lg shadow-2xl text-center">
          <div className="flex justify-center mb-4">
            <LogoPrimary />
          </div>
          <p className="text-[10px] text-ash uppercase tracking-[0.2em] mb-8 font-bold">
            Private Admin Decrypt Terminal
          </p>

          {errorMsg && (
            <div className="bg-graphite border border-ember-gold text-ember-gold text-xs p-3 rounded-sm mb-6 text-center font-mono font-semibold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] text-ash mb-2 uppercase font-bold text-left tracking-wider">
                System Decrypt Key
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••••"
                className="w-full bg-graphite border border-iron text-bone text-[14px] px-3 py-2.5 rounded-sm focus:border-ember-gold focus:ring-0 outline-none text-center font-mono"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-white text-inkwell h-12 font-bold text-[14px] rounded-sm hover:bg-bone transition-all duration-200 cursor-pointer uppercase tracking-wider"
            >
              Unlock Terminal
            </button>
          </form>
        </div>
      </main>
    );
  }

  // 2. Render Admin Panel Dashboard [3]
  return (
    <main className="min-h-screen bg-obsidian text-bone font-sans p-8">
      <div className="max-w-[1200px] mx-auto space-y-8">
        
        {/* Header Block */}
        <header className="border-b border-iron pb-6 flex justify-between items-end">
          <div>
            <p className="text-ash text-[10px] uppercase tracking-widest mb-1">Administrative Node</p>
            <h1 className="font-heading text-heading text-bone italic tracking-tight">Trading-Analytics-Suite</h1>
          </div>
          <div className="flex gap-4">
            <button
              onClick={fetchAdminData}
              className="w-8 h-8 rounded-sm bg-graphite border border-iron flex items-center justify-center text-ash hover:text-white transition-colors cursor-pointer"
              title="Refresh Analytics"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
            </button>
            <button
              onClick={() => setIsAuthorized(false)}
              className="text-ash hover:text-ember-gold font-bold text-xs bg-graphite hover:bg-iron px-4 py-2 rounded-sm border border-iron transition cursor-pointer"
            >
              LOCK TERMINAL
            </button>
          </div>
        </header>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate border border-iron p-6 rounded-[10px]">
            <span className="block text-[10px] font-bold text-ash uppercase tracking-widest mb-1">Total Active Users</span>
            <span className="text-2xl font-black text-bone tabular-nums">{totalUsers}</span>
          </div>

          <div className="bg-slate border border-iron p-6 rounded-[10px]">
            <span className="block text-[10px] font-bold text-ash uppercase tracking-widest mb-1">Total Trades Logged</span>
            <span className="text-2xl font-black text-bone tabular-nums">{totalTrades}</span>
          </div>

          <div className="bg-slate border border-iron p-6 rounded-[10px]">
            <span className="block text-[10px] font-bold text-ash uppercase tracking-widest mb-1">Feedback Submissions</span>
            <span className="text-2xl font-black text-ember-gold tabular-nums">{feedback.length}</span>
          </div>
        </div>

        {/* System Diagnostics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-start">
          {/* Column 1: Sentry Error Command Center */}
          <div className="col-span-12 lg:col-span-4 bg-slate border border-iron rounded-[10px] p-6 space-y-6">
            <div>
              <h3 className="text-[14px] font-bold uppercase tracking-widest text-ash">Sentry Diagnostics</h3>
              <p className="text-xs text-ash mt-0.5">External secure routing to live error stack traces.</p>
            </div>
            
            <div className="bg-inkwell p-4 rounded-sm border border-iron space-y-2">
              <p className="text-[10px] text-ash uppercase font-bold">Node Health</p>
              <div className="flex items-center justify-between text-xs">
                <span className="text-ash">Client Errors:</span>
                <span className="font-bold text-bone">Monitored</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-ash">Server Crashes:</span>
                <span className="font-bold text-bone">Monitored</span>
              </div>
            </div>

            <a 
              href="https://sentry.io/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full bg-white text-inkwell h-12 flex items-center justify-center font-bold text-xs rounded-sm hover:bg-bone transition-all duration-200 uppercase tracking-wider select-none text-center"
            >
              Launch Sentry Console
            </a>
          </div>

          {/* Column 2: Embedded PostHog Dashboard Portal (With standard unicode arrows instead of ->) [1] */}
          <div className="col-span-12 lg:col-span-8 bg-slate border border-iron rounded-[10px] overflow-hidden flex flex-col h-[300px]">
            <div className="px-6 py-4 border-b border-iron bg-graphite/30 flex justify-between items-center">
              <div>
                <h3 className="text-[14px] font-bold uppercase tracking-widest text-ash">PostHog Traffic Portal</h3>
                <p className="text-xs text-ash">Real-time user analytics and session recordings.</p>
              </div>
              <a 
                href="https://posthog.com/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[10px] font-bold text-ember-gold hover:text-white transition-colors"
              >
                OPEN FULL CONSOLE
              </a>
            </div>
            
            <div className="flex-1 bg-inkwell flex items-center justify-center p-6 text-center relative">
              <div className="max-w-md space-y-2 z-10">
                <span className="material-symbols-outlined text-ember-gold text-2xl">analytics</span>
                <h4 className="font-bold text-sm text-bone">Embedded Analytics Portal Ready</h4>
                {/* Standard Unicode arrows (→) used here to prevent JSX compiling errors [1] */}
                <p className="text-xs text-ash leading-relaxed">
                  To stream live traffic lines and registration graphs here: Go to PostHog → Dashboards → Share Dashboard → Enable "Share Publicly" → Paste the shared link into your admin configuration [1.1.4].
                </p>
              </div>
              
              <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]" />
            </div>
          </div>
        </div>

        {/* Feedback Inbox */}
        <section className="bg-slate border border-iron rounded-[10px] overflow-hidden">
          <div className="px-6 py-4 border-b border-iron bg-graphite/30">
            <h3 className="text-[14px] font-bold uppercase tracking-widest text-ash">User Feedback Inbox</h3>
          </div>

          {loading ? (
            <div className="p-8 text-center text-ash text-xs uppercase tracking-widest">
              Fetching ledger...
            </div>
          ) : feedback.length === 0 ? (
            <div className="p-8 text-center text-ash text-xs uppercase tracking-widest">
              No feedback submissions logged.
            </div>
          ) : (
            <div className="divide-y divide-iron">
              {feedback.map((item) => (
                <div key={item.id} className="p-6 hover:bg-inkwell/20 transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-[13px] text-bone">{item.email}</span>
                      <span className="text-[11px] text-ash tabular-nums">
                        {new Date(item.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-ash leading-relaxed italic pr-6">
                      "{item.message}"
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteFeedback(item.id)}
                    className="text-xs text-ash hover:text-ember-gold font-bold transition-colors cursor-pointer border border-iron hover:border-ember-gold/30 px-3 py-1.5 rounded-sm bg-graphite"
                  >
                    RESOLVE & DELETE
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  );
}