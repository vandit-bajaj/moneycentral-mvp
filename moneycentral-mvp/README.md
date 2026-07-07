# 🚀 MoneyCentral - The Digital Family Office

**A comprehensive financial management platform built for families by families.**

## 🌟 Overview

MoneyCentral is a modern, feature-rich financial dashboard designed to help families manage their wealth, investments, and expenses all in one secure place. It combines real-time market data with personal financial tracking to provide actionable insights and complete financial visibility.

## ✨ Key Features

- **📊 Investment Tracking**: Monitor your entire portfolio with real-time market data
  - Stocks, Bonds, MFs, Gold, and alternative investments
  - Automated price updates and performance tracking
  - Gain/Loss calculations and ROI analysis

- **💵 Expense Management**: Track spending effortlessly
  - Categorize expenses and create budgets
  - Visualize spending patterns with charts
  - Set spending alerts and reminders

- **🔗 Account Aggregation**: Connect all your financial accounts
  - Banks, credit cards, loans, and investments
  - Single sign-on integration (via FOSBASE APIs)
  - Unified financial overview

- **🎯 Goal Planning**: Plan for your financial future
  - Retirement planning calculator
  - Education savings goals
  - Custom goal tracking with progress monitoring

- **🔔 Smart Alerts**: Stay informed with real-time notifications
  - Market price alerts
  - Expense threshold warnings
  - Bill payment reminders

## 🎨 Technology Stack

### Frontend (Next.js + TypeScript)
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) v4
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Charts**: [Recharts](https://recharts.org/)
- **State Management**: React Context + Zustand
- **Authentication**: NextAuth.js

### Backend (FOSBASE - Coming Soon)
- Python-based financial data aggregation APIs
- Bank and investment account integration
- Real-time market data connectors

## 📁 Project Structure

```
MoneyCentral-MVP/
├── app/                   # Next.js App Router
│   ├── (auth)/             # Authentication flows
│   ├── (dashboard)/        # Authenticated dashboard
│   ├── assets/             # Global assets
│   ├── lib/                # Core utilities and providers
│   └── globals.css         # Global styles
├── components/             # Reusable UI components
├── config/                 # Configuration files
├── context/                # React Context providers
├── lib/                    # Utility functions
├── middleware.ts           # Auth middleware
├── next.config.js          # Next.js configuration
├── postcss.config.js       # PostCSS configuration
├── README.md               # Project documentation
├── tailwind.config.ts      # Tailwind CSS configuration
└── tsconfig.json           # TypeScript configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm 9+ or yarn 1+

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/MoneyCentral-MVP.git
cd MoneyCentral-MVP
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your API keys and configuration:
```env
# Auth configuration
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# API keys (if needed)
# API_KEY=your-api-key
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

The app will be available at [http://localhost:3000](http://localhost:3000).

## 🛠️ Development Commands

### Build and Run
```bash
# Build the project
npm run build

# Start the production server
npm run start
```

### Linting
```bash
# Run linter
npm run lint
```

### Format Code
```bash
# Format with Prettier
npm run format
```

## 🎨 Design System

### Color Palette
```typescript
// src/config/theme.ts
export const colors = {
  primary: '#3b82f6',      // Blue
  secondary: '#10b981',    // Green
  accent: '#f59e0b',       // Orange
  destructive: '#ef4444',  // Red
  background: '#f8fafc',   // Light Gray
  card: '#ffffff',
  border: '#e2e8f0',
  text: '#1e293b',
  muted: '#64748b',
};
```

### Typography
```typescript
// src/config/theme.ts
export const fonts = {
  sans: 'var(--font-sans)',
  serif: 'var(--font-serif)',
};
```

## 🔐 Authentication

Authentication is handled by **NextAuth.js** with OAuth 2.0 providers. You can configure providers in `src/lib/auth.ts`.

## 🏗️ Architecture

- **App Router**: Next.js 14 App Router provides file-based routing and server components
- **Server Components**: Used for data fetching and rendering
- **Client Components**: Used for interactive elements (marked with `'use client'`)
- **API Routes**: Backend API endpoints in `app/api/`

## 🚀 Future Plans

- [ ] Backend development with FOSBASE
- [ ] Mobile app (React Native)
- [ ] AI-powered financial insights
- [ ] Multi-currency support
- [ ] PDF statement parsing
- [ ] User roles and permissions

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Create a feature branch (`git checkout -b feature/AmazingFeature`)
2. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
3. Push to the branch (`git push origin feature/AmazingFeature`)
4. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework for production
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful, reusable UI components
- [Recharts](https://recharts.org/) - React charting library

---

Made with ❤️ by Vandit Bajaj