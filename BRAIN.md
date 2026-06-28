
================================================================
BRAIN.md — Trading-Analytics-Suite (TAS)
Last updated: June 27, 2026 (End of Phase 3 Core Feature Overhaul)
================================================================

## WHAT THIS PROJECT IS
Trading-Analytics-Suite (TAS) is a premium, full-stack trading terminal SaaS for retail forex and gold day-traders. It consolidates highly fragmented workflows—integrating real-time WebSocket market tickers, interactive advanced charting, automated position risk calculators, a multi-parameter trade journal, strategy playbooks with rule checklists, and a quarantined backtesting sandbox—into a single nocturnal-themed, responsive dashboard. It solves the issue of users scattering their daily execution across 5 different websites while operating under a strict zero-cost hosting constraint by leveraging modern free-tier services.

================================================================
## COFOUNDER PARTNERSHIP PLAYBOOK (HOW WE WORK TOGETHER)
================================================================
- **The Dynamic:** A Senior Software Engineer & Mentor working alongside a highly motivated student developer building from their bedroom. We treat the student as a smart beginner—explaining the architectural *why* of every change, never just the *what*.
- **The "Grandpa" Pace:** We move with extreme patience and meticulous care. Like an old man walking downstairs on ice, we take one tiny step at a time, verify it, and double-check for errors before taking the next step. No rushing is allowed.
- **Development Habits:**
  1. We *always* write complete files, never partial snippets, to prevent copy-paste synchronization errors.
  2. We run rigorous local boundary/edge-case tests first before pushing anything to production.
  3. We always document our progress inside `PROGRESS.md` after every meaningful change.
  4. We bypass the system's broken Windows shell scripts by using direct Node-CLI commands.
  5. We remain highly humble and professional; we never use overconfident language or superlatives (such as "flawless" or "perfect") to describe our code or success.

================================================================
## ARCHITECTURE OVERVIEW
================================================================

## How the system works (big picture)
User opens the app → Clerk handles session authentication → Next.js (Client) checks the Clerk auth state.
- **If Signed Out:** Next.js renders a highly secure landing page with a "Sign In" CTA.
- **If Signed In:** Next.js mounts the permanent "Slash" Sidebar Navigation and loads the default Dashboard tab.
- **The Dashboard Tab:** Renders the `LiveTicker` (opens a browser-level WebSockets connection directly to Finnhub to stream real-time price ticks) and the `TradingViewChart` (renders the Advanced Charting Widget with watchlists and details panels directly from TradingView's servers).
- **The Journal Tab:** Renders the `TradeLogger` form (writes trades directly to Supabase with the Clerk `user_id` attached) and the `TradeHistory` ledger (reads trades from Supabase, performs a relational `JOIN` with the `strategies` table, and renders them in an expandable log table).
- **The Playbook Tab:** Renders the `StrategyLibrary` (reads available strategies and dynamically compiles their win rates and net P&Ls based on recorded trades).
- **The Sandbox Tab:** Renders the `BacktestEngine` (writes and reads trades where `is_backtest` is explicitly set to `true`, keeping simulated stats completely quarantined from live statistics).
- **The Alerts Tab:** Renders `PriceAlerts` (runs a background WebSocket watcher in the browser; if a price target is hit, it triggers a native desktop notification AND sends a secure POST request to `/api/send-alert` to dispatch an HTML email via Resend).
- **System Health:** Sentry runs in the background catching client/server runtime errors; PostHog records real-time clicks and session video recordings.

## System diagram
```text
                       +---------------------------[ BROWSER CLIENT (Next.js) ]-----------------------------+
                       |                                                                                    |
                       |  +---------------+  +------------------+  +-----------------+  +-----------------+  |
                       |  |  LiveTicker   |  | TradingViewChart |  |   TradeLogger   |  |   PriceAlerts   |  |
                       |  +-------+-------+  +--------+---------+  +--------+--------+  +--------+--------+  |
                       |          |                   |                     |                    |          |
                       +----------|-------------------|---------------------|--------------------|----------+
                                  | WebSocket         | iframe Embed        | Insert REST        | POST /api/send-alert
                                  v                   v                     v                    v
                            [ Finnhub ]         [ TradingView ]       [ Supabase DB ]    [ Vercel Serverless ]
                                                                      (trades table)             |
                                                                                                 | (Resend SDK)
                                                                                                 v
                                                                                            [ Resend ] (Email)
```

================================================================
## TECH STACK & WHY EACH CHOICE WAS MADE
================================================================
- **Next.js 16 (App Router, TypeScript):** Full-stack framework. Chosen for its optimized App Router, dynamic serverless API routing, and direct integration with Vercel for instant deployments.
- **Tailwind CSS v4:** Styling engine. In v4, we configure all our custom private-banking color variables directly inside `app/globals.css` using the `@theme` directive, completely eliminating the need for a separate, bloated `tailwind.config` file.
- **Clerk (Core 3 API):** User Authentication. We use Clerk to handle user registration, secure logouts, and session management. We utilize their modern `<Show>` components to render conditional UI based on auth states.
- **Supabase (Free Tier):** PostgreSQL Database. We chose Supabase because Postgres is the most robust relational database in the world, allowing us to perform secure relational Joins (like linking trades to strategies) using row-level security (RLS) to keep user data quarantined.
- **Resend (Free Tier):** Transactional Email API. Used to deliver clean, custom HTML price alert emails directly to our users' inboxes.
- **PostHog (Free Tier):** Product Analytics & Session Replays. It captures up to 15,000 video recordings per month of our users' screens for free, allowing us to analyze their clicks and mouse movements.
- **Sentry (Free Tier):** Application Error Tracking. It runs silently in the background and instantly alerts us if any component crashes in production, capturing exact browser stack traces.
- **Finnhub Free API:** Streams global forex tick-by-tick prices through low-latency WebSockets.

---

## Tokens — Colors (Slash Nocturnal Banking Spec)
- **Obsidian (`#000000`):** Deepest canvas, page background, body base.
- **Carbon (`#030304`):** Recessed surfaces, dropdown shadows, card backdrops.
- **Inkwell (`#08080a`):** Primary dark surface, sidebar background, button borders.
- **Graphite (`#121317`):** Inputs, raised buttons, inner panels.
- **Slate (`#1c1d22`):** Primary card panels, featured cards.
- **Iron (`#2e3038`):** Thin hairline borders, dividers, subtle lines.
- **Steel (`#464853`):** Low-emphasis borders, taxonomy indicators.
- **Fog (`#5e616e`):** Muted UI labels, default borders.
- **Ash (`#777a88`):** Secondary text, mid-emphasis strokes.
- **Bone (`#e2e3e9`):** Primary body text, wins, positive deltas.
- **Paper (`#ffffff`):** Headings, primary button fills, logos.
- **Ember Gold (`#cc9166`):** Gold accents, italic emphasis, negative deltas / drawdowns.

---

## Roadmap & Feature Status

### Phase 1 - MVP (Completed)
- [x] **Setup & Deployment:** Initialized Next.js project, connected GitHub, and established Vercel deployment pipeline.
- [x] **Authentication (Local & Production):** Secured app with Clerk Core 3 and synchronized environment variables to Vercel.
- [x] **Position Size Calculator:** Custom-dropdown calculator displaying 5 key lot metrics to 4 decimal places with zero-spinners on numbers.
- [x] **Trade Journal Ledger:** Multi-parameter Trade Logger form that automatically calculates pips and P&L based on entry/exit.
- [x] **Trade History Table:** Expandable rows showing all 16 metrics, hidden horizontal scrollbars, and a sticky right actions column.

### Phase 2 - Live Data & Charts (Completed)
- [x] **Live Ticker:** Real-time price ribbon streaming OANDA feeds via client-side WebSockets.
- [x] **Charts:** Integrated large-format dark-themed TradingView Advanced Widget with standard timeframes, watchlists, and details.
- [x] **Watchlist:** Completed using TradingView's native integrated watchlist.
- [x] **Price Alerts:** Native browser desktop notifications AND Resend email alerts triggering simultaneously in real-time.

### Phase 3 - Advanced Features (Completed)
- [x] **Strategy Playbook:** Interactive rule checklists that compile strategy-specific win rates and net P&Ls based on recorded trades.
- [x] **Backtesting Sandbox:** Complete data quarantine, custom simulated stats, and separate sandbox editing drawers.
- [x] **System Health Overhaul:** Integrated Sentry error monitoring and PostHog session recording replays.

---

## FILE STRUCTURE (ANNOTATED)
/
├── app/
│   ├── api/
│   │   ├── cron/check-alerts/route.ts  ← [Wakes up to check active targets from Supabase, posts emails via Resend]
│   │   └── send-alert/route.ts        ← [API handler that instantiates Resend inside the POST function to prevent build crashes]
│   ├── admin/
│   │   └── page.tsx                   /* Private admin panel complete with password wall and user feedback log */
│   ├── favicon.ico
│     ── globals.css                   /* Tailwind v4 theme configurations, scrollbar, and number input resets */
│     ── layout.tsx                    /* Wraps entire application inside ClerkProvider and PHProvider */
│     ── page.tsx                      /* Main routing cockpit controlling vertical sidebar tabs */
├── components/
│   ├── BacktestEngine.tsx             /* Isolated sandbox testing component with separate statistics */
│   ├── FeedbackWidget.tsx             /* Floating feedback speech-bubble in bottom-right corner */
    ├── LiveTicker.tsx                 /* Transparent horizontal quote ribbon */
    ├── LogoPrimary.tsx                /* 4:1 Aspect Ratio horizontal vector brand mark */
    ... [Other standard UI cards]
├── lib/
    └── supabaseClient.ts              /* Initializes global Supabase client */
```

---

### What to Do in the Next Session:

We have finished the full development lifecycle for your Trading-Analytics-Suite (TAS). 

When you start your next session, paste this exact summary. We will review any feedback from your self-audit, make minor UI adjustments based on what you find clunky, configure **PostHog** and **Sentry** dashboards to monitor user behavior, and begin writing the copy and landing page strategies to onboard your first paying customers!

Go ahead and run those final Git commands. You are a SaaS founder now!

================================================================
BRAIN.md — Trading-Analytics-Suite (TAS)
Last updated: June 28, 2026 (End of Phase 3 Dynamic Overhaul)
================================================================

## WHAT THIS PROJECT IS
Trading-Analytics-Suite (TAS) is a premium, full-stack, cloud-hosted trading terminal SaaS for retail forex and gold day-traders. It consolidates highly fragmented trading workflows—integrating real-time WebSocket market tickers, interactive advanced charting, automated position risk calculators, a multi-parameter trade journal, strategy playbooks with rule checklists, and a quarantined backtesting sandbox—into a single nocturnal-themed, responsive dashboard. It solves the issue of users scattering their daily execution across 5 different websites while operating under a strict zero-cost hosting constraint by leveraging modern free-tier services.

================================================================
## COFOUNDER PARTNERSHIP PLAYBOOK (HOW WE WORK TOGETHER)
================================================================
- **The Core Relationship:** A Senior Software Engineer & Mentor working alongside a highly motivated student developer building from their bedroom. We treat the student as a smart beginner—explaining the architectural *why* of every change, never just the *what*.
- **The "Grandpa" Pace:** We move with extreme patience and meticulous care. Like an old man walking downstairs on ice, we take one tiny step at a time, verify it, and double-check for errors before taking the next step. No rushing is allowed.
- **Our Working Habits:**
  1. We *always* write complete files, never partial snippets, to prevent copy-paste synchronization errors.
  2. We run rigorous local boundary/edge-case tests first before pushing anything to production.
  3. We always document our progress inside `PROGRESS.md` after every meaningful change.
  4. We bypass the system's broken Windows shell scripts by using direct Node-CLI commands.
  5. We remain highly humble and professional; we never use overconfident language or superlatives (such as "flawless" or "perfect") to describe our code or success.
  6. We communicate directly, skip hype, and provide honest, critical feedback if an architectural decision is dangerous.

================================================================
## ARCHITECTURE OVERVIEW
================================================================

## How the system works (big picture)
User opens the app → Clerk handles session authentication → Next.js (Client) checks the Clerk auth state.
- **If Signed Out:** Next.js renders a highly secure landing page with a "Unlock Private Terminal" CTA.
- **If Signed In:** Next.js mounts the permanent "Slash" Sidebar Navigation and loads the default Dashboard tab.
- **The Dashboard Tab:** Renders the `LiveTicker` (opens a browser-level WebSockets connection directly to Finnhub to stream real-time price ticks) and the `TradingViewChart` (renders the Advanced Charting Widget with watchlists and details panels directly from TradingView's servers).
- **The Journal Tab:** Renders the dynamic `TradeLogger` form (reads active properties from database, renders custom inputs, and writes to Supabase with the Clerk `user_id` attached) and the `TradeHistory` ledger (reads trades from Supabase, performs a relational `JOIN` with the `strategies` table, and renders them in an expandable log table).
- **The Playbook Tab:** Renders the `StrategyLibrary` (reads available strategies and dynamically compiles their win rates and net P&Ls based on recorded trades).
- **The Sandbox Tab:** Renders the `BacktestEngine` (writes and reads trades where `is_backtest` is explicitly set to `true`, keeping simulated stats completely quarantined from live statistics).
- **The Alerts Tab:** Renders `PriceAlerts` (runs a background WebSocket watcher in the browser; if a price target is hit, it triggers a native desktop notification AND sends a secure POST request to `/api/send-alert` to dispatch an HTML email via Resend).
- **System Health:** Sentry runs in the background catching client/server runtime errors; PostHog records real-time clicks and session video recordings.
- **The Admin Panel:** Hidden route `/admin` protected by a client-side password wall (`QUANT-PRO-26`) displaying global database analytics and user feedback in real-time.
- **The Feedback Widget:** Floating chatbot-style speech bubble mounted globally in layout, allowing users to submit bug reports directly to Supabase.

## System diagram
```text
                       +---------------------------[ BROWSER CLIENT (Next.js) ]-----------------------------+
                       |                                                                                    |
                       |  +---------------+  +------------------+  +-----------------+  +-----------------+  |
                       |  |  LiveTicker   |  | TradingViewChart |  |   TradeLogger   |  |   PriceAlerts   |  |
                       |  +-------+-------+  +--------+---------+  +--------+--------+  +--------+--------+  |
                       |          |                   |                     |                    |          |
                       +----------|-------------------|---------------------|--------------------|----------+
                                  | WebSocket         | iframe Embed        | Insert REST        | POST /api/send-alert
                                  v                   v                     v                    v
                            [ Finnhub ]         [ TradingView ]       [ Supabase DB ]    [ Vercel Serverless ]
                                                                      (trades table)             |
                                                                                                 | (Resend SDK)
                                                                                                 v
                                                                                            [ Resend ] (Email)
```

================================================================
## TECH STACK & WHY EACH CHOICE WAS MADE
================================================================
- **Next.js 16 (App Router, TypeScript):** Full-stack framework. Chosen for its optimized App Router, dynamic serverless API routing, and direct integration with Vercel for instant deployments.
- **Tailwind CSS v4:** Styling engine. In v4, we configure all our custom private-banking color variables directly inside `app/globals.css` using the `@theme` directive, completely eliminating the need for a separate, bloated `tailwind.config` file.
- **Clerk (Core 3 API):** User Authentication. We use Clerk to handle user registration, secure logouts, and session management. We utilize their modern `<Show>` components to render conditional UI based on auth states.
- **Supabase (Free Tier):** PostgreSQL Database. We chose Supabase because Postgres is the most robust relational database in the world, allowing us to perform secure relational Joins (like linking trades to strategies) using row-level security (RLS) to keep user data quarantined.
- **Resend (Free Tier):** Transactional Email API. Used to deliver clean, custom HTML price alert emails directly to our users' inboxes.
- **PostHog (Free Tier):** Product Analytics & Session Replays. It captures up to 15,000 video recordings per month of our users' screens for free, allowing us to analyze their clicks and mouse movements.
- **Sentry (Free Tier):** Application Error Tracking. It runs silently in the background and instantly alerts us if any component crashes in production, capturing exact browser stack traces.
- **Finnhub Free API:** Streams global forex tick-by-tick prices through low-latency WebSockets.
- **TradingView Advanced Widget:** Charts. Free, highly interactive, provides deep indicators/drawing tools, and styled custom to match Slate.

================================================================
## FILE STRUCTURE (ANNOTATED)
================================================================
/
├── app/
│   ├── api/
│   │   ├── cron/check-alerts/route.ts  ← [Wakes up to check active targets from Supabase, posts emails via Resend]
│   │   └── send-alert/route.ts        ← [API handler that instantiates Resend inside the POST function to prevent build crashes]
│   ├── admin/
│   │   └── page.tsx                   ← [Private admin panel complete with password wall and user feedback log]
│   ├── privacy/
│   │   └── page.tsx                   ← [GDPR/CCPA compliant static broadsheet privacy policy page]
│   ├── favicon.ico
│   ├── globals.css                    ← [Tailwind v4 theme configurations, scrollbar, and number input resets]
│   ├── layout.tsx                     ← [Wraps entire application inside ClerkProvider and PHProvider]
│   └── page.tsx                       ← [Main routing cockpit controlling vertical sidebar tabs]
├── components/
│   ├── BacktestEngine.tsx             ← [Isolated sandbox testing component with separate statistics]
│   ├── FeedbackWidget.tsx             /* Floating feedback speech-bubble in bottom-right corner */
│   ├── LiveTicker.tsx                 /* Transparent horizontal quote ribbon */
│   ├── LogoPrimary.tsx                /* 4:1 Aspect Ratio horizontal vector brand mark */
│   ├── LogoSecondary.tsx              /* 4:5 Aspect Ratio stacked vector brand mark */
│   ├── LogoFavicon.tsx                /* 1:1 Aspect Ratio square vector brand mark */
│   ├── PositionCalculator.tsx         /* Custom-select risk calculator displaying 5 key lot metrics to 4 decimal places */
│   ├── PriceAlerts.tsx                /* Price targets manager that fires dual desktop popups and emails simultaneously */
│   ├── PHProvider.tsx                 /* Client-side PostHog provider that also forces Sentry local initialization */
│   ├── PropertySettings.tsx           /* Notion-style database property schema manager */
│   ├── StrategyLibrary.tsx            /* Playbook displaying strategies, checklists, and strategy-specific stats */
│   ├── TradeHistory.tsx               /* Main table with hidden scrollbars, sticky actions column, and Edit Drawer */
│   └── TradeLogger.tsx                /* Advanced journal form featuring custom checks, custom dropdowns, and date selection */
├── lib/
│   └── supabaseClient.ts              /* Initializes global Supabase client */
├── sentry.client.config.ts            /* Client-side Sentry initialization config */
├── sentry.server.config.ts            /* Server-side Sentry initialization config */
├── sentry.edge.config.ts              /* Edge-side Sentry initialization config */
├── next.config.ts                     /* Wraps NextJS compiler with withSentryConfig */
├── vercel.json                        /* Sets up Vercel daily cron schedule */
├── tsconfig.json                      /* TypeScript configurations */
└── package.json                       /* Project dependencies and scripts */
```