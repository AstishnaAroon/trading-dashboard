"use client";

import React, { useState } from "react";
import { Show, SignInButton, UserButton, useUser } from "@clerk/nextjs";
import LogoPrimary from "../components/LogoPrimary";
import LiveTicker from "../components/LiveTicker";
import PositionCalculator from "../components/PositionCalculator";
import TradeLogger from "../components/TradeLogger";
import TradingViewChart from "../components/TradingViewChart";
import StrategyLibrary from "../components/StrategyLibrary";
import BacktestEngine from "../components/BacktestEngine";
import TradeHistory from "../components/TradeHistory";
import PriceAlerts from "../components/PriceAlerts";
import BulkImporter from "../components/BulkImporter";
import PropertySettings from "../components/PropertySettings"; // Import our new Property Settings Manager [3]

export default function Home() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<"dashboard" | "journal" | "playbook" | "sandbox" | "alerts" | "settings">("dashboard");
  
  // Controls sub-tabs inside the Journal view (Manual Logging vs CSV Importing) [3]
  const [journalSubTab, setJournalSubTab] = useState<"manual" | "bulk">("manual");

  return (
    <main className="min-h-screen bg-obsidian text-bone overflow-hidden flex relative selection:bg-ember-gold selection:text-obsidian">
      {/* Signed Out View - Premium Centered Landing Page */}
      <Show when="signed-out">
        <div className="flex flex-col items-center justify-center flex-grow min-h-screen">
          <div className="text-center max-w-md w-full bg-slate border border-iron p-8 rounded-lg shadow-2xl">
            <div className="flex justify-center mb-6">
              <LogoPrimary />
            </div>
            <p className="text-ash text-xs uppercase tracking-widest mb-6">
              Nocturnal Private Ledger
            </p>
            <SignInButton mode="modal">
              <button className="w-full bg-white text-inkwell h-12 font-bold text-sm tracking-tight rounded-sm hover:bg-bone transition-colors duration-200 cursor-pointer">
                Unlock Private Terminal
              </button>
            </SignInButton>
          </div>
        </div>
      </Show>

      {/* Signed In View - Unified Multi-View Terminal */}
      <Show when="signed-in">
        {/* Left Sidebar Navigation */}
        <aside className="w-[260px] h-screen fixed left-0 top-0 bg-inkwell border-r border-iron flex flex-col py-6 z-50">
          {/* Sidebar Header with Brand Logo */}
          <div className="px-6 mb-10 shrink-0">
            <LogoPrimary />
            <p className="text-[10px] uppercase tracking-[0.2em] text-ash mt-1.5 font-bold">
              Private Terminal
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-1 px-3">
            {/* 1. Dashboard Tab */}
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-3.5 px-4 py-2.5 transition-colors duration-200 cursor-pointer text-left ${
                activeTab === "dashboard"
                  ? "text-white font-bold border-l-2 border-ember-gold bg-graphite"
                  : "text-ash font-medium hover:text-white hover:bg-graphite/40"
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={activeTab === "dashboard" ? "text-ember-gold" : "text-ash"}>
                <rect x="3" y="3" width="7" height="9" rx="1" />
                <rect x="14" y="3" width="7" height="5" rx="1" />
                <rect x="14" y="12" width="7" height="9" rx="1" />
                <rect x="3" y="16" width="7" height="5" rx="1" />
              </svg>
              <span className="text-sm">Dashboard</span>
            </button>

            {/* 2. Journal Tab */}
            <button
              onClick={() => setActiveTab("journal")}
              className={`w-full flex items-center gap-3.5 px-4 py-2.5 transition-colors duration-200 cursor-pointer text-left ${
                activeTab === "journal"
                  ? "text-white font-bold border-l-2 border-ember-gold bg-graphite"
                  : "text-ash font-medium hover:text-white hover:bg-graphite/40"
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={activeTab === "journal" ? "text-ember-gold" : "text-ash"}>
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              <span className="text-sm">Journal</span>
            </button>

            {/* 3. Playbook Tab */}
            <button
              onClick={() => setActiveTab("playbook")}
              className={`w-full flex items-center gap-3.5 px-4 py-2.5 transition-colors duration-200 cursor-pointer text-left ${
                activeTab === "playbook"
                  ? "text-white font-bold border-l-2 border-ember-gold bg-graphite"
                  : "text-ash font-medium hover:text-white hover:bg-graphite/40"
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={activeTab === "playbook" ? "text-ember-gold" : "text-ash"}>
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
              <span className="text-sm">Playbook</span>
            </button>

            {/* 4. Sandbox Tab */}
            <button
              onClick={() => setActiveTab("sandbox")}
              className={`w-full flex items-center gap-3.5 px-4 py-2.5 transition-colors duration-200 cursor-pointer text-left ${
                activeTab === "sandbox"
                  ? "text-white font-bold border-l-2 border-ember-gold bg-graphite"
                  : "text-ash font-medium hover:text-white hover:bg-graphite/40"
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={activeTab === "sandbox" ? "text-ember-gold" : "text-ash"}>
                <path d="M4.5 16.5c-1.5 1.26-2.5 3.19-2.5 5.5h20c0-2.31-1-4.24-2.5-5.5" />
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
              </svg>
              <span className="text-sm">Sandbox</span>
            </button>

            {/* 5. Alerts Tab */}
            <button
              onClick={() => setActiveTab("alerts")}
              className={`w-full flex items-center gap-3.5 px-4 py-2.5 transition-colors duration-200 cursor-pointer text-left ${
                activeTab === "alerts"
                  ? "text-white font-bold border-l-2 border-ember-gold bg-graphite"
                  : "text-ash font-medium hover:text-white hover:bg-graphite/40"
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={activeTab === "alerts" ? "text-ember-gold" : "text-ash"}>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className="text-sm">Alerts</span>
            </button>
          </nav>

          {/* Sidebar Footer with Settings & Support & Clerk Account Status */}
          <div className="mt-auto px-3 shrink-0">
            {/* Functional Settings Trigger [3, DESIGN (5).md] */}
            <button
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center gap-3.5 px-4 py-2 mb-1 transition-colors duration-200 cursor-pointer text-left ${
                activeTab === "settings"
                  ? "text-white font-bold border-l-2 border-ember-gold bg-graphite"
                  : "text-ash font-medium hover:text-white hover:bg-graphite/40"
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={activeTab === "settings" ? "text-ember-gold" : "text-ash"}>
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <span className="text-[14px]">Settings</span>
            </button>

            <div className="pt-6 border-t border-iron px-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-graphite border border-iron shrink-0">
                <UserButton />
              </div>
              <div className="overflow-hidden">
                <p className="text-[13px] font-bold truncate text-slate-100">
                  {user?.primaryEmailAddress?.emailAddress.split("@")[0] || "Trader Account"}
                </p>
                <p className="text-[11px] text-ash truncate">Portfolio Manager</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Main Window Panel */}
        <main className="ml-[260px] flex-1 min-h-screen flex flex-col relative overflow-y-auto">
          {/* Top Navigation Bar with persistent Live Price Feed */}
          <header className="h-14 bg-inkwell border-b border-iron flex items-center justify-between px-6 sticky top-0 z-40 shrink-0">
            <div className="flex-1 max-w-xl">
              <LiveTicker />
            </div>
            
            {/* Hero Brand Stamp */}
            <div className="flex items-center gap-6 pl-6">
              <p className="font-serif text-sm italic text-ember-gold max-w-sm text-right leading-tight tracking-wide select-none">
                "Mastering the market with a higher standard"
              </p>
            </div>
          </header>

          {/* Dynamic Dashboard View Switcher */}
          <div className="p-8 flex-1 max-w-[1400px] w-full mx-auto animate-fadeIn">
            {/* View A: Dashboard Layout (Chart & Calculator) */}
            {activeTab === "dashboard" && (
              <div className="grid grid-cols-12 gap-6 w-full items-start">
                <div className="col-span-12 lg:col-span-8 w-full">
                  <TradingViewChart />
                </div>
                <div className="col-span-12 lg:col-span-4 w-full">
                  <PositionCalculator />
                </div>
              </div>
            )}

            {/* View B: Journal Layout (Tabbed Logger & History) [3] */}
            {activeTab === "journal" && (
              <div className="grid grid-cols-12 gap-6 w-full items-start">
                {/* Left Column: Logging / Importing (4 columns) */}
                <div className="col-span-12 lg:col-span-4 w-full flex flex-col gap-4">
                  {/* Journal Sub-Tabs: Sharp 2px Corners [DESIGN (5).md] */}
                  <div className="flex bg-inkwell p-1 rounded-sm border border-iron select-none w-full shrink-0">
                    <button
                      onClick={() => setJournalSubTab("manual")}
                      className={`flex-1 text-center text-[10px] font-bold py-2 rounded-sm transition-all duration-200 cursor-pointer uppercase tracking-wider ${
                        journalSubTab === "manual" ? "bg-white text-inkwell" : "text-ash hover:text-white"
                      }`}
                    >
                      Manual Log
                    </button>
                    <button
                      onClick={() => setJournalSubTab("bulk")}
                      className={`flex-1 text-center text-[10px] font-bold py-2 rounded-sm transition-all duration-200 cursor-pointer uppercase tracking-wider ${
                        journalSubTab === "bulk" ? "bg-white text-inkwell" : "text-ash hover:text-white"
                      }`}
                    >
                      Bulk Import
                    </button>
                  </div>

                  {/* Conditional Render of Logger or Importer [3] */}
                  {journalSubTab === "manual" ? <TradeLogger /> : <BulkImporter />}
                </div>

                {/* Right Column: History Ledger (8 columns) */}
                <div className="col-span-12 lg:col-span-8 w-full">
                  <TradeHistory />
                </div>
              </div>
            )}

            {/* View C: Strategy Playbook */}
            {activeTab === "playbook" && (
              <div className="w-full">
                <StrategyLibrary />
              </div>
            )}

            {/* View D: Backtest Sandbox */}
            {activeTab === "sandbox" && (
              <div className="w-full">
                <BacktestEngine />
              </div>
            )}

            {/* View E: Alert Center */}
            {activeTab === "alerts" && (
              <div className="w-full max-w-lg mx-auto">
                <PriceAlerts />
              </div>
            )}

            {/* View F: Database Properties Settings [3, DESIGN (5).md] */}
            {activeTab === "settings" && (
              <div className="w-full">
                <PropertySettings />
              </div>
            )}
          </div>

          {/* Footer Space */}
          <footer className="mt-auto pt-12 pb-8 px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-ash text-[11px] uppercase tracking-widest border-t border-iron/50 bg-inkwell/20">
            <p>© 2026 Trading-Analytics-Suite. All systems operational.</p>
            <div className="flex gap-8">
              <a className="hover:text-ember-gold transition-colors" href="#">Terms of Desk</a>
              <a className="hover:text-ember-gold transition-colors" href="#">Privacy Protocol</a>
              <a className="hover:text-ember-gold transition-colors" href="#">Terminal Version 5.1.0</a>
            </div>
          </footer>
        </main>
      </Show>
    </main>
  );
}