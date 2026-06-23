# Trading Dashboard SaaS - Progress Tracker

We are building a unified workspace for retail forex traders (the "ClickUp of trading") to solve workflow fragmentation. The design goal is a "gliding" experience that consolidates position sizing, trade logging, charting, and history into one clean interface.

---

## Technical Stack
- **Framework:** Next.js (App Router, TypeScript)
- **Styling:** Tailwind CSS + shadcn/ui
- **Auth:** Clerk (Core 3 API)
- **Database:** Supabase (Pending)
- **Hosting:** Vercel

---

## Roadmap & Feature Status

### Phase 1 - MVP (Current Phase)
- [x] **Setup & Deployment:** Initialize Next.js project, connect GitHub, and establish automated Vercel deployment pipeline.
- [x] **Authentication (Local):** Secure app using Clerk, set up route protection middleware, and configure user status UI.
- [ ] **Authentication (Production):** Sync local environment variables to Vercel dashboard.
- [ ] **Position Size Calculator:** Build interactive form accepting balance, risk %, and stop loss in pips to output lot sizes.
- [ ] **Trade Logger:** Implement manual trade entry form (pair, direction, entry/exit prices, lot size, notes) with auto P&L calculation.
- [ ] **Trade History:** Build a clean statistics panel (total P&L, win rate, average risk-to-reward) and a historical log table.

### Phase 2 - Live Data & Charts
- [ ] **Live Ticker:** Connect free Finnhub API for major forex pairs.
- [ ] **Charts:** Integrate TradingView Lightweight Charts library.
- [ ] **Watchlist:** Allow saving favorite pairs locally or in-database.
- [ ] **Price Alerts:** Background alerts triggered by market price crossing user thresholds.

### Phase 3 - Advanced Features
- [ ] **Strategy Library:** Catalog and save personal trading systems.
- [ ] **Backtesting Engine:** Simulate strategy performance over historical windows.

---

## Development History & Architecture Notes

### June 23, 2026: Local Environment Resolution & Clerk Setup
- **Windows PATH Resolution:** Encountered system errors (`ENOENT` / `spawn`) where local shell configurations misidentified directories. Resolved by bypassing default shell scripts.
  - **Local Dev Server Bypass Command:** 
    ```powershell
    node node_modules/next/dist/bin/next dev
    ```
  - **Direct npm Module Bypass Command:** 
    ```powershell
    node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" install <package_name>
    ```
- **Clerk Integration (Core 3):** Resolved deprecation issues from recent Clerk upgrades. Replaced removed legacy components (`<SignedIn>` and `<SignedOut>`) with the unified `<Show>` element:
  ```tsx
  <Show when="signed-in">/* Protected UI */</Show>
  <Show when="signed-out">/* Public UI */</Show>