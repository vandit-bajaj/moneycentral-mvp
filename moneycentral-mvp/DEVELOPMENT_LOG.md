# 📋 MoneyCentral — Development Log

> **Purpose:** This is the live engineering journal for the MoneyCentral project. Every implementation task is logged here **before** work begins (with planned approach) and **after** completion (with results and files touched). This file is the single source of truth for what was built, when, and why.

---

## Current Workspace Snapshot

```
MC Project/
├── .agents/
│   └── skills/
│       └── log-updates.md          # Skill: enforces dev-log protocol
├── .git/                            # Git repository (connected to GitHub)
├── moneycentral-mvp/
│   ├── README.md                    # Project overview & vision document
│   ├── DEVELOPMENT_LOG.md           # ← This file (engineering journal)
│   └── ARCHITECTURE_AND_ROADMAP.md  # Master execution blueprint
└── (no application code yet)
```

**Remote Repository:** `https://github.com/vandit-bajaj/MoneyCentral-MVP.git`  
**Branch:** `main`

---

## Log Entries

---

### LOG-001 | Foundation Documentation Setup

| Field | Detail |
|---|---|
| **Date** | 2026-07-08 |
| **Status** | ✅ COMPLETE |
| **Task** | Create `DEVELOPMENT_LOG.md` and `ARCHITECTURE_AND_ROADMAP.md` — the two foundational documentation files required before any application code is written. |
| **Approach** | Audit current workspace structure, then author both files from scratch. No application code is created in this step. |
| **Files Created** | `moneycentral-mvp/DEVELOPMENT_LOG.md`, `moneycentral-mvp/ARCHITECTURE_AND_ROADMAP.md` |
| **Files Modified** | — |
| **Notes** | Both files are awaiting user review and approval before Phase 1 implementation begins. |

---

### LOG-002 | Phase 1 — Next.js Project Scaffolding & Dependency Setup

| Field | Detail |
|---|---|
| **Date** | 2026-07-08 |
| **Status** | ✅ COMPLETE |
| **Task** | Initialize Next.js (App Router + TypeScript + Tailwind CSS) in `moneycentral-mvp/`, install `@supabase/supabase-js` and `yahoo-finance2`, clean boilerplate, create `.env.local.example`, verify build. |
| **Approach** | 1) Used `npx create-next-app` with App Router, TS, Tailwind flags to scaffold into a temp dir, then merged into existing `moneycentral-mvp/`. 2) `npm install` production deps. 3) Replaced default `page.tsx` with placeholder. 4) Created env template. 5) Ran `npm run build` — zero errors. |
| **Files Created** | `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts` (via Tailwind v4 — config lives in `globals.css`), `postcss.config.mjs`, `eslint.config.mjs`, `.gitignore`, `.env.local.example`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `public/*` |
| **Files Modified** | `src/app/page.tsx` (replaced boilerplate), `src/app/layout.tsx` (updated metadata), `package.json` (renamed to `moneycentral-mvp`) |
| **Notes** | Build verified: `next build` → ✅ Compiled successfully (Next.js 16.2.10, Turbopack). Deps: `@supabase/supabase-js@^2.110.1`, `yahoo-finance2@^3.15.4`. Existing docs (README, DEVELOPMENT_LOG, ARCHITECTURE_AND_ROADMAP) preserved. |

---

### LOG-003 | Phase 1 — Live Stock Price Engine (API Route + Dashboard Playground)

| Field | Detail |
|---|---|
| **Date** | 2026-07-08 |
| **Status** | ✅ COMPLETE |
| **Task** | Create `src/app/api/quote/route.ts` API route using `yahoo-finance2` for server-side NSE/BSE price fetching. Build interactive playground on `src/app/page.tsx` with symbol input, fetch button, and live price display. |
| **Approach** | 1) Created API route handler that accepts `?symbol=` param, auto-appends `.NS` for NSE, calls `yahoo-finance2` `quote()`, returns clean JSON. 2) Rewrote `page.tsx` as a `"use client"` component with state, fetch logic, dark-themed Tailwind UI. 3) Added fadeIn keyframe to `globals.css`. 4) Verified build. |
| **Files Created** | `src/app/api/quote/route.ts` |
| **Files Modified** | `src/app/page.tsx`, `src/app/globals.css`, `DEVELOPMENT_LOG.md` |
| **Notes** | Build verified: `next build` → ✅ Compiled successfully. Routes: `○ /` (static), `ƒ /api/quote` (dynamic). Had to use `any` cast for yahoo-finance2 quote result due to v3 typing issue with `never` return type. |

---

### LOG-004 | Phase 1 — Supabase Client + Holdings CRUD (Add Form + Portfolio Table)

| Field | Detail |
|---|---|
| **Date** | 2026-07-08 |
| **Status** | ✅ COMPLETE |
| **Task** | Create Supabase client utility, build "Add Stock to Portfolio" form and "Portfolio Holdings" table on the dashboard page. Insert/fetch from Supabase `holdings` table. |
| **Approach** | 1) Verified `.env.local` present and covered by `.env*` in `.gitignore`. 2) Created `src/lib/supabaseClient.ts` with `createClient`. 3) Rewrote `src/app/page.tsx` with 3 sections: live price check (preserved), add-holding form (3 inputs + insert), portfolio table (`useEffect` fetch). 4) Verified via `tsc --noEmit`. |
| **Files Created** | `src/lib/supabaseClient.ts` |
| **Files Modified** | `src/app/page.tsx`, `DEVELOPMENT_LOG.md` |
| **Notes** | `tsc --noEmit` → ✅ zero errors. Dashboard now has 3 functional sections. Supabase `holdings` table must exist with columns: `id`, `ticker_symbol`, `quantity`, `avg_buy_price`, `created_at`. User needs to create this table in Supabase dashboard before testing insert/fetch. |

---
