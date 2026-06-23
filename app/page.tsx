import { Show, SignInButton, UserButton } from "@clerk/nextjs";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-white p-6">
      <div className="text-center max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">
          Trading Dashboard
        </h1>
        <p className="text-slate-400 text-sm mb-6">
          The ClickUp of trading. Manage your workflow in one clean platform.
        </p>

        <div className="flex flex-col items-center justify-center gap-4">
          {/* If the user is signed out, show the Sign In button */}
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-xl transition cursor-pointer">
                Sign In to Start Gliding
              </button>
            </SignInButton>
          </Show>

          {/* If the user is signed in, show the success message and avatar */}
          <Show when="signed-in">
            <div className="flex items-center gap-3 bg-slate-800 p-3 rounded-xl w-full justify-between">
              <span className="text-sm font-medium text-slate-200 pl-2">
                Logged in successfully
              </span>
              <UserButton />
            </div>
          </Show>
        </div>
      </div>
    </main>
  );
}