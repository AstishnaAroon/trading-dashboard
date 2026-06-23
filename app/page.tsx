import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import PositionCalculator from "../components/PositionCalculator";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white p-6 relative">
      {/* Top Navigation - Displays only when the user is signed in */}
      <Show when="signed-in">
        <header className="absolute top-0 right-0 p-6 flex items-center gap-3">
          <span className="text-xs text-slate-500 font-medium">Account</span>
          <UserButton />
        </header>
      </Show>

      {/* Signed Out View - Landing Page */}
      <Show when="signed-out">
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
      </Show>

      {/* Signed In View - Main Tools */}
      <Show when="signed-in">
        <div className="flex flex-col items-center justify-center w-full max-w-lg mt-8 animate-fadeIn">
          <PositionCalculator />
        </div>
      </Show>
    </main>
  );
}