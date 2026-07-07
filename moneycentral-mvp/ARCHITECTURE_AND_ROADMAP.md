# 🏗️ MoneyCentral — Architecture & Roadmap

> **Purpose:** This is the master execution blueprint for MoneyCentral, a unified digital "Family Office" for Indian investors. Every database schema, folder structure, API route, and implementation phase is documented here. No application code is written without an approved entry in this document.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Tech Stack](#2-tech-stack)
3. [Database Schema (Supabase / PostgreSQL)](#3-database-schema-supabase--postgresql)
4. [Folder & File Layout (Next.js App Router)](#4-folder--file-layout-nextjs-app-router)
5. [Phased Execution Roadmap](#5-phased-execution-roadmap)
6. [Key Architecture Decisions](#6-key-architecture-decisions)

---

## 1. System Overview

MoneyCentral is a personal finance and investment tracking platform designed as an **absolute problem-solver for Indian investors**. It evolves from a manual stock tracker into a full-fledged family-level portfolio intelligence platform.

### Core Feature Pillars

| Pillar | Description |
|---|---|
| **Manual Stock Holdings** | Add buy/sell transactions for NSE/BSE stocks with quantity, price, and date |
| **Live Dashboard** | Real-time market prices fetched server-side via `yahoo-finance2` |
| **Family Portfolios** | Group multiple users under a Family Group with aggregated views |
| **IPO & Corporate Actions** | Browse upcoming IPOs, dividends, splits, and bonus announcements |
| **Curated News Feed** | Filtered share market news relevant to the user's holdings |
| **AI Portfolio Analyzer** | GPT/Gemini-powered health check: concentration risk, sector allocation, suggestions |
| **Learning Center** | Interactive stock market education modules for beginners |

---

## 2. Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend Framework** | Next.js 14+ (App Router) | Server components, streaming, built-in API routes |
| **Language** | TypeScript | Type safety across the full stack |
| **Styling** | Tailwind CSS | Rapid UI development, consistent design system |
| **Database** | Supabase (PostgreSQL) | Managed Postgres, real-time subscriptions, built-in auth |
| **Auth** | Supabase Auth | Email/password, Google OAuth, magic links |
| **Row Level Security** | Supabase RLS Policies | Per-user and per-family data isolation at the DB level |
| **Market Data** | `yahoo-finance2` (npm) | Server-side fetching of NSE/BSE live quotes |
| **Deployment** | Vercel | Zero-config Next.js hosting, edge functions |

---

## 3. Database Schema (Supabase / PostgreSQL)

### 3.1 Entity Relationship Diagram (Conceptual)

```
┌──────────────┐       ┌───────────────────┐       ┌──────────────────┐
│    users     │       │  users_to_groups  │       │  family_groups   │
│──────────────│       │───────────────────│       │──────────────────│
│ id (PK)      │──┐    │ id (PK)           │    ┌──│ id (PK)          │
│ email        │  └───>│ user_id (FK)      │    │  │ name             │
│ full_name    │       │ group_id (FK)     │<───┘  │ created_by (FK)  │
│ avatar_url   │       │ role              │       │ invite_code      │
│ created_at   │       │ joined_at         │       │ created_at       │
└──────────────┘       └───────────────────┘       └──────────────────┘
        │
        │ 1:N
        ▼
┌──────────────────────┐
│      holdings        │
│──────────────────────│
│ id (PK)              │
│ user_id (FK)         │
│ group_id (FK, nullable) │
│ ticker_symbol        │
│ exchange (NSE/BSE)   │
│ quantity             │
│ avg_buy_price        │
│ buy_date             │
│ notes                │
│ created_at           │
│ updated_at           │
└──────────────────────┘
        │
        │ 1:N
        ▼
┌──────────────────────┐
│    transactions      │
│──────────────────────│
│ id (PK)              │
│ holding_id (FK)      │
│ user_id (FK)         │
│ type (BUY/SELL)      │
│ quantity             │
│ price_per_unit       │
│ transaction_date     │
│ notes                │
│ created_at           │
└──────────────────────┘
```

### 3.2 Table Definitions

#### `users` (extends Supabase `auth.users`)

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PK, references `auth.users(id)` | Supabase auth user ID |
| `email` | `text` | NOT NULL, UNIQUE | User's email |
| `full_name` | `text` | NOT NULL | Display name |
| `avatar_url` | `text` | NULLABLE | Profile picture URL |
| `created_at` | `timestamptz` | DEFAULT `now()` | Account creation timestamp |

#### `family_groups`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PK, DEFAULT `gen_random_uuid()` | Group identifier |
| `name` | `text` | NOT NULL | e.g., "Bajaj Family Portfolio" |
| `created_by` | `uuid` | FK → `users(id)` | The user who created the group |
| `invite_code` | `text` | UNIQUE, NOT NULL | 8-char alphanumeric code for joining |
| `created_at` | `timestamptz` | DEFAULT `now()` | Group creation timestamp |

#### `users_to_groups` (Junction Table)

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PK, DEFAULT `gen_random_uuid()` | Row identifier |
| `user_id` | `uuid` | FK → `users(id)`, NOT NULL | Member user |
| `group_id` | `uuid` | FK → `family_groups(id)`, NOT NULL | Family group |
| `role` | `text` | NOT NULL, CHECK (`admin`, `member`, `viewer`) | Permission level |
| `joined_at` | `timestamptz` | DEFAULT `now()` | Join timestamp |

> **Unique constraint:** `(user_id, group_id)` — a user can only be in a group once.

#### `holdings`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PK, DEFAULT `gen_random_uuid()` | Holding identifier |
| `user_id` | `uuid` | FK → `users(id)`, NOT NULL | Owner of this holding |
| `group_id` | `uuid` | FK → `family_groups(id)`, NULLABLE | Optional family group association |
| `ticker_symbol` | `text` | NOT NULL | e.g., `RELIANCE.NS`, `TCS.BO` |
| `exchange` | `text` | NOT NULL, CHECK (`NSE`, `BSE`) | Stock exchange |
| `quantity` | `decimal` | NOT NULL, CHECK (`> 0`) | Number of shares held |
| `avg_buy_price` | `decimal` | NOT NULL, CHECK (`> 0`) | Weighted average purchase price |
| `buy_date` | `date` | NULLABLE | Date of initial purchase |
| `notes` | `text` | NULLABLE | User's personal notes on this holding |
| `created_at` | `timestamptz` | DEFAULT `now()` | Row creation |
| `updated_at` | `timestamptz` | DEFAULT `now()` | Last modification |

#### `transactions`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `uuid` | PK, DEFAULT `gen_random_uuid()` | Transaction identifier |
| `holding_id` | `uuid` | FK → `holdings(id)`, NOT NULL | Parent holding |
| `user_id` | `uuid` | FK → `users(id)`, NOT NULL | Who performed the transaction |
| `type` | `text` | NOT NULL, CHECK (`BUY`, `SELL`) | Transaction direction |
| `quantity` | `decimal` | NOT NULL, CHECK (`> 0`) | Number of shares |
| `price_per_unit` | `decimal` | NOT NULL, CHECK (`> 0`) | Price at time of transaction |
| `transaction_date` | `date` | NOT NULL | When the trade occurred |
| `notes` | `text` | NULLABLE | Optional transaction notes |
| `created_at` | `timestamptz` | DEFAULT `now()` | Record creation |

### 3.3 Row Level Security (RLS) Strategy

| Table | Policy | Rule |
|---|---|---|
| `users` | Users can only read/update their own profile | `auth.uid() = id` |
| `family_groups` | Members can read their groups; only admins can update | Via `users_to_groups` JOIN |
| `users_to_groups` | Users can read their own memberships | `auth.uid() = user_id` |
| `holdings` | Users see their own holdings + holdings in their family groups | `auth.uid() = user_id` OR via group membership |
| `transactions` | Users see transactions for holdings they own or share via family groups | Same cascading logic as holdings |

---

## 4. Folder & File Layout (Next.js App Router)

```
moneycentral-mvp/
├── public/                              # Static assets
│   ├── favicon.ico
│   ├── logo.svg
│   └── images/
│
├── src/
│   ├── app/                             # Next.js App Router (pages & layouts)
│   │   ├── layout.tsx                   # Root layout (global providers, nav)
│   │   ├── page.tsx                     # Landing / marketing page
│   │   ├── globals.css                  # Tailwind base + custom tokens
│   │   │
│   │   ├── (auth)/                      # Auth route group (no layout nesting)
│   │   │   ├── login/
│   │   │   │   └── page.tsx             # Login page
│   │   │   ├── signup/
│   │   │   │   └── page.tsx             # Sign-up page
│   │   │   └── callback/
│   │   │       └── route.ts             # Supabase OAuth callback handler
│   │   │
│   │   ├── (dashboard)/                 # Authenticated dashboard route group
│   │   │   ├── layout.tsx               # Dashboard shell (sidebar, topbar)
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx             # Portfolio overview with live prices
│   │   │   ├── holdings/
│   │   │   │   ├── page.tsx             # All holdings list
│   │   │   │   ├── add/
│   │   │   │   │   └── page.tsx         # Add new holding form
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx         # Single holding detail + transactions
│   │   │   ├── family/
│   │   │   │   ├── page.tsx             # Family groups list
│   │   │   │   ├── create/
│   │   │   │   │   └── page.tsx         # Create new family group
│   │   │   │   └── [groupId]/
│   │   │   │       └── page.tsx         # Family group portfolio view
│   │   │   ├── ipo/
│   │   │   │   └── page.tsx             # Upcoming IPOs & corporate actions
│   │   │   ├── news/
│   │   │   │   └── page.tsx             # Curated share market news feed
│   │   │   ├── analyzer/
│   │   │   │   └── page.tsx             # AI portfolio health analyzer
│   │   │   ├── learn/
│   │   │   │   ├── page.tsx             # Learning center home
│   │   │   │   └── [moduleId]/
│   │   │   │       └── page.tsx         # Individual learning module
│   │   │   └── settings/
│   │   │       └── page.tsx             # User profile & preferences
│   │   │
│   │   └── api/                         # API Route Handlers
│   │       ├── holdings/
│   │       │   └── route.ts             # CRUD for holdings
│   │       ├── transactions/
│   │       │   └── route.ts             # CRUD for transactions
│   │       ├── market/
│   │       │   ├── quote/
│   │       │   │   └── route.ts         # Live price fetch via yahoo-finance2
│   │       │   └── search/
│   │       │       └── route.ts         # Ticker search / autocomplete
│   │       ├── family/
│   │       │   └── route.ts             # Family group management
│   │       └── analyzer/
│   │           └── route.ts             # AI analysis endpoint
│   │
│   ├── components/                      # Reusable React components
│   │   ├── ui/                          # Primitive UI elements
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Badge.tsx
│   │   │   └── Skeleton.tsx
│   │   ├── layout/                      # Layout components
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Topbar.tsx
│   │   │   └── MobileNav.tsx
│   │   ├── holdings/                    # Holdings-specific components
│   │   │   ├── HoldingCard.tsx
│   │   │   ├── HoldingForm.tsx
│   │   │   └── HoldingTable.tsx
│   │   ├── dashboard/                   # Dashboard-specific components
│   │   │   ├── PortfolioSummary.tsx
│   │   │   ├── PriceTickerBar.tsx
│   │   │   └── GainLossChart.tsx
│   │   └── family/                      # Family-specific components
│   │       ├── FamilyGroupCard.tsx
│   │       └── MemberList.tsx
│   │
│   ├── lib/                             # Shared utilities & configurations
│   │   ├── supabase/
│   │   │   ├── client.ts                # Browser-side Supabase client
│   │   │   ├── server.ts                # Server-side Supabase client
│   │   │   └── middleware.ts            # Auth middleware for protected routes
│   │   ├── market/
│   │   │   └── yahoo.ts                 # yahoo-finance2 wrapper functions
│   │   ├── utils.ts                     # General helper functions
│   │   └── constants.ts                 # App-wide constants (exchanges, etc.)
│   │
│   ├── types/                           # TypeScript type definitions
│   │   ├── database.ts                  # Supabase-generated DB types
│   │   ├── holdings.ts                  # Holding & transaction interfaces
│   │   └── market.ts                    # Market data interfaces
│   │
│   └── hooks/                           # Custom React hooks
│       ├── useUser.ts                   # Current auth user hook
│       ├── useHoldings.ts               # Holdings data fetching
│       └── useMarketData.ts             # Live price polling hook
│
├── supabase/                            # Supabase local config
│   ├── migrations/                      # SQL migration files
│   │   └── 001_initial_schema.sql       # Tables, RLS policies, indexes
│   └── seed.sql                         # Development seed data
│
├── .env.local                           # Supabase keys (NEVER committed)
├── .gitignore
├── next.config.ts                       # Next.js configuration
├── tailwind.config.ts                   # Tailwind theme & extensions
├── tsconfig.json                        # TypeScript configuration
├── package.json
├── README.md                            # Project overview
├── DEVELOPMENT_LOG.md                   # Engineering journal
└── ARCHITECTURE_AND_ROADMAP.md          # ← This file
```

---

## 5. Phased Execution Roadmap

### Phase 1 — Manual Stock Entry & Live Dashboard Prices
> **Goal:** A working app where a user can sign up, add stock holdings, and see live NSE/BSE prices on a dashboard.

| Step | Task | Key Files |
|---|---|---|
| 1.1 | Initialize Next.js project with TypeScript + Tailwind CSS | `package.json`, `tailwind.config.ts`, `tsconfig.json` |
| 1.2 | Set up Supabase project, configure `.env.local` with keys | `.env.local`, `lib/supabase/client.ts`, `lib/supabase/server.ts` |
| 1.3 | Write SQL migration: `users`, `holdings`, `transactions` tables + RLS policies | `supabase/migrations/001_initial_schema.sql` |
| 1.4 | Build authentication flow (sign up, log in, OAuth callback, middleware) | `(auth)/*`, `lib/supabase/middleware.ts` |
| 1.5 | Create dashboard layout shell (sidebar, topbar, responsive nav) | `(dashboard)/layout.tsx`, `components/layout/*` |
| 1.6 | Build "Add Holding" form with ticker search autocomplete | `holdings/add/page.tsx`, `api/market/search/route.ts` |
| 1.7 | Implement holdings list page with live price enrichment | `holdings/page.tsx`, `api/market/quote/route.ts`, `lib/market/yahoo.ts` |
| 1.8 | Build portfolio dashboard with summary cards (total value, day P&L, overall gain/loss) | `dashboard/page.tsx`, `components/dashboard/*` |
| 1.9 | Add single holding detail page with transaction history | `holdings/[id]/page.tsx` |
| 1.10 | Write development seed data + test end-to-end | `supabase/seed.sql` |

**Deliverable:** Authenticated user can CRUD stock holdings and see a live-priced portfolio dashboard.

---

### Phase 2 — Family Portfolios & Group Management
> **Goal:** Users can create family groups, invite members, and view aggregated portfolio analytics.

| Step | Task | Key Files |
|---|---|---|
| 2.1 | SQL migration: `family_groups`, `users_to_groups` tables + RLS | `supabase/migrations/002_family_groups.sql` |
| 2.2 | Create family group page + invite code flow | `family/create/page.tsx`, `api/family/route.ts` |
| 2.3 | Family group portfolio view (aggregated holdings across members) | `family/[groupId]/page.tsx` |
| 2.4 | Role-based permissions (admin, member, viewer) enforcement | RLS policies, middleware checks |
| 2.5 | Link holdings to family groups optionally | `holdings/add/page.tsx` (update), `HoldingForm.tsx` |

**Deliverable:** Multi-user family portfolios with role-based access and aggregated views.

---

### Phase 3 — IPO Tracker & Corporate Actions
> **Goal:** Users see upcoming IPOs, dividends, stock splits, and bonus announcements.

| Step | Task | Key Files |
|---|---|---|
| 3.1 | Design IPO & corporate actions data model (or external API integration) | `types/ipo.ts`, API research |
| 3.2 | Build IPO listing page with filtering (open, upcoming, listed) | `ipo/page.tsx` |
| 3.3 | Corporate actions feed (dividends, splits, bonuses) for user's holdings | `ipo/page.tsx` or separate `actions/page.tsx` |

**Deliverable:** IPO calendar and corporate action alerts.

---

### Phase 4 — Curated News Feed
> **Goal:** Display share market news filtered by relevance to user's holdings.

| Step | Task | Key Files |
|---|---|---|
| 4.1 | Integrate news API (Google News RSS, or dedicated finance API) | `api/news/route.ts`, `lib/news/` |
| 4.2 | Build news feed page with holding-based filtering | `news/page.tsx` |
| 4.3 | Bookmark / save articles feature | DB migration, UI component |

**Deliverable:** Personalized, holding-aware news feed.

---

### Phase 5 — AI Portfolio Health Analyzer
> **Goal:** AI-powered analysis of portfolio concentration, sector allocation, and risk metrics.

| Step | Task | Key Files |
|---|---|---|
| 5.1 | Build portfolio data aggregation layer (sector mapping, weightage) | `lib/analyzer/` |
| 5.2 | Integrate Gemini/GPT API for natural-language analysis | `api/analyzer/route.ts` |
| 5.3 | Build analyzer results UI with charts and recommendations | `analyzer/page.tsx`, chart components |

**Deliverable:** One-click AI portfolio health report with actionable insights.

---

### Phase 6 — Interactive Learning Center
> **Goal:** Beginner-friendly stock market education modules.

| Step | Task | Key Files |
|---|---|---|
| 6.1 | Design learning module content schema | `types/learning.ts`, DB or CMS |
| 6.2 | Build module listing and individual lesson pages | `learn/page.tsx`, `learn/[moduleId]/page.tsx` |
| 6.3 | Add progress tracking and quizzes | DB migration, UI components |

**Deliverable:** Interactive education center with tracked progress.

---

## 6. Key Architecture Decisions

### 6.1 Why Server-Side Market Data Fetching?
The `yahoo-finance2` package runs on Node.js. All market data calls happen in Next.js API routes or Server Components — **never** from the browser. This avoids CORS issues, protects API usage patterns, and enables caching via Next.js `revalidate`.

### 6.2 Why Supabase RLS Over Middleware-Only Auth?
RLS policies are the **last line of defense**. Even if middleware or API route auth is bypassed, the database itself enforces that users can only access their own data. This is critical for a financial application.

### 6.3 Holdings vs. Transactions: Dual-Table Design
- `holdings` represents the **current state** of a position (ticker, total quantity, average price).
- `transactions` represents the **history** (individual buy/sell events).
- On each new transaction, the `holdings` row is recalculated (weighted average price, total quantity). This prevents expensive re-computation on every dashboard load.

### 6.4 Family Group Isolation
Family group data is not merged into individual portfolios by default. Users explicitly tag holdings as belonging to a family group. This keeps personal and family views cleanly separated while allowing aggregation when desired.

### 6.5 Ticker Format Convention
All tickers follow Yahoo Finance format:
- **NSE:** `SYMBOL.NS` (e.g., `RELIANCE.NS`)
- **BSE:** `SYMBOL.BO` (e.g., `TCS.BO`)

This ensures consistent lookups across the application.

---

> **⚠️ This document is the source of truth. All implementation must follow the structures and phases defined here. Any deviation requires updating this document first.**
