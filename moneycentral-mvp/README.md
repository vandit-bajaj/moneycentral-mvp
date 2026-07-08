# MoneyCentral 🪙

MoneyCentral is a unified financial hub designed to serve as a digital "Family Office" for Indian investors. Rather than forcing users to navigate scattered portfolios across separate platforms like Zerodha, Groww, Upstox, and ICICI Direct, MoneyCentral centralizes asset data into a single, highly visual dashboard to track collective net worth, analyze asset allocations, and monitor sector exposure.

---

## 🚀 Features

### Implemented MVP Capabilities
* **Manual Asset Ingestion**: Users can easily input their stock holdings manually, specifying details like stock names, average buying prices, and quantities. This strategy completely bypasses complex initial regulatory friction while unlocking rapid core product development.
* **Live Market Data Proxy**: Real-time asset pricing fetches securely through a backend middleman using the `yahoo-finance2` ecosystem. It natively supports Indian markets flawlessly using `.NS` and `.BO` suffixes for NSE and BSE equities.
* **Secure User Authentication**: Complete user signup and login security walls are handled out-of-the-box via integrated Supabase Auth workflows.
* **ACID-Compliant Relational Data**: Portfolio details are safely written to a production-ready PostgreSQL schema, guaranteeing that data stays strictly consistent and preventing disappearing asset states due to server glitches.
* **Premium Dashboard UI**: Includes a scannable performance table tracking profits and losses, styled dynamically with local Indian currency formatting (e.g., ₹1,50,000 instead of $150,000).
* **Multi-Member Family Accounting**: Features structured base capabilities enabling investors to combine and review multi-member accounts inside a singular workspace.
* **AI Portfolio Analytics**: Incorporates advanced portfolio diagnostics and actionable asset health summaries processed via custom Gemini API integrations.

---

## 🛠️ Tech Stack

* **Frontend**: React.js with Next.js (App Router) for rapid server-side rendering, styled cleanly with Tailwind CSS, and visualized using premium charting libraries.
* **Backend**: Node.js/TypeScript serverless API routes acting as a secure middleman proxy to fetch external market data and handle asynchronous operations.
* **Database & ORM**: Supabase (PostgreSQL RDBMS) paired with Prisma ORM for type-safe database migrations and highly reliable relational layouts.
* **Core Packages**: `@supabase/supabase-js` for database queries, `yahoo-finance2` for free market rates, and the Gemini API for intelligence engines.
* **Hosting & Deployment**: Vercel edge production servers connected directly to a live GitHub deployment pipeline.

---

## 🔮 Future Horizons & Roadmap

1. **Automating Advanced Data
