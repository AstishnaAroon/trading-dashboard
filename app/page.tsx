import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import PositionCalculator from "../components/PositionCalculator";
import TradeLogger from "../components/TradeLogger";
import TradeHistory from "../components/TradeHistory";
import LiveTicker from "../components/LiveTicker";
import TradingViewChart from "../components/TradingViewChart";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-slate-950 text-white p-6 relative">
      {/* Top Navigation - Displays only when the user is signed in */}
      <Show when="signed-in">
        <header className="w-full max-w-5xl flex items-center justify-between py-6 border-b border-slate-900 mb-8">
          <h1 className="text-xl font-bold tracking-tight text-slate-200">
            Glide Dashboard
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-medium">Account</span>
            <UserButton />
          </div>
        </header>
      </Show>

      {/* Signed Out View - Landing Page */}
      <Show when="signed-out">
        <div className="flex flex-col items-center justify-center flex-grow">
          <div className="text-center max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl">
            <h1 className="text-3xl font-extrabold tracking-tight mb-2">
              Trading Dashboard
            </h1>
            <p className="text-slate-400 text-sm mb-6">
              The ClickUp of trading. Manage your workflow in one clean platform.
            </p>

            <SignInButton mode="modal">
              <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-xl transition cursor-pointer">
                Sign In to Start Gliding
              </button>
            </SignInButton>
          </div>
        </div>
      </Show>

      {/* Signed In View - Full Dashboard Cockpit */}
      <Show when="signed-in">
        <div className="flex flex-col gap-8 w-full max-w-5xl pb-16 items-start animate-fadeIn">
          {/* Row 1: Real-time Market Ticker */}
          <div className="w-full">
            <LiveTicker />
          </div>

          {/* Row 2: Forms Grid (Calculator & Logger) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
            {/* Column 1: Calculator */}
            <div className="flex justify-center">
              <PositionCalculator />
            </div>

            {/* Column 2: Trade Logger */}
            <div className="flex justify-center">
              <TradeLogger />
            </div>
          </div>

          {/* Row 3: Interactive Candlestick Chart */}
          <div className="w-full">
            <TradingViewChart />
          </div>

          {/* Row 4: Stats Panel & Historical Log Table */}
          <div className="w-full">
            <TradeHistory />
          </div>
        </div>
      </Show>
    </main>
  );
}