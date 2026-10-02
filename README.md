# Portfolio Dashboard

A dynamic, real-time portfolio dashboard built with **Next.js (App Router)**, **TypeScript**, and **Tailwind CSS**. It reads your holdings, fetches live market data server-side, computes investment/present-value/gain-loss, groups by sector, and auto-refreshes every 15 seconds.

---

## Features

- **Holdings table** with Particulars, Purchase Price, Qty, Investment, Portfolio %, NSE/BSE, **CMP**, Present Value, Gain/Loss, **P/E Ratio**, and **Latest EPS**.
- **Live data** fetched from a market-data provider on the server (API keys never reach the browser).
- **Auto-refresh** every 15s via `setInterval` (pauses while the tab is hidden, refreshes on focus).
- **Color-coded gain/loss** — green for gains, red for losses.
- **Sector grouping** with per-sector totals (investment, present value, gain/loss) plus charts.
- **Charts** (Recharts): sector allocation, invested vs. present value, sector gain/loss, top holdings.
- **Caching & resilience** — in-memory TTL cache, request batching, graceful fallback to a snapshot provider on failure.
- **Accessible, responsive** layout with light/dark themes and skeleton loading states.

---

## Getting started

### Prerequisites

- Node.js 20+
- A BharatStock API key (optional — the app falls back to a bundled snapshot if none is set)

### Install

```bash
npm install
```

### Configure environment

Create a `.env.local` file in the project root:

```bash
BHARATSTOCK_API_KEY=your_api_key_here
```

If no key is provided, the dashboard automatically uses the bundled mock/snapshot data so it still runs end-to-end.

### Run

```bash
npm run dev
```

Open [Live-Link](https://8byte-assignment-ten.vercel.app/).

### Other scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run typecheck` | TypeScript (`tsc --noEmit`) |
| `npm run lint` | ESLint |
| `npm run test` | Unit tests (Vitest) |
| `npm run import:holdings` | Regenerate `data/holdings.json` from the source workbook |

---

## Configuration

All provider configuration lives in `config/config.json` — a single switch point:

- `provider.active` — the live provider (`bharatstock`).
- `provider.fallback` / `provider.fallbackOnError` — the fallback source and whether to use it on error.
- `marketData.<provider>` — `baseUrl`, `quotePath`, `fundamentalsPath`, timeouts, and cache TTLs.
- `symbolMappings` — maps holding symbols (e.g. BSE numeric codes) to provider tickers.

Your holdings live in `data/holdings.json` (name, symbol, exchange, sector, purchase price, quantity).

---

## Architecture

```
app/
  api/portfolio/route.ts   # Server route: validate holdings -> fetch market data -> compute -> JSON
  page.tsx                 # Client dashboard: table, sector summary, charts, 15s refresh
lib/
  calculations.ts          # Pure portfolio math (investment, present value, gain/loss, sectors)
  providers/               # Provider abstraction (BharatStock, fallback, mock) + merge/cache
  cache/cache.ts           # In-memory TTL cache
config/config.json         # Single source of truth for provider config
data/holdings.json         # Portfolio holdings
types/type.ts              # Shared domain types
```

**Request flow:** the browser calls `GET /api/portfolio` → the route validates holdings, asks the provider layer for quotes (batched, cached), computes metrics with pure functions, and returns a JSON payload. Secrets stay on the server.

---

## Technical write-up

### Data sources

The assignment references Yahoo Finance (CMP) and Google Finance (P/E, latest earnings), neither of which has an official public API. Rather than scrape — which is brittle and breaks on markup changes — this project uses the **BharatStock API** as a stable, keyed source for Indian equities:

- **CMP** comes from the batch quotes endpoint `GET /v1/stocks/quotes?symbols=…` (the latest `close` price).
- **P/E ratio and EPS** come from the per-ticker `GET /v1/stocks/{ticker}/ratios` endpoint, because the batch quotes response intentionally returns price data only.

The provider layer is abstracted behind a `MarketDataProvider` interface, so swapping in a different source (or an unofficial Yahoo/Google scraper) is a localized change.

### Key challenges & solutions

- **Two endpoints for one row.** Price and fundamentals live on different endpoints. The provider fetches quotes once (batched for all symbols), then fetches ratios per found ticker in parallel (`Promise.all`). Ratios rarely change, so they're cached with a long TTL (1 hour) while quotes use a short TTL (15s) — minimizing API calls.
- **Symbol mismatches.** Holdings include BSE numeric codes (e.g. `532174.BO`) that the API doesn't recognize. `symbolMappings` translates them to real tickers before the request; unmatched symbols fall back to snapshot data.
- **Rate limits / reliability.** An in-memory TTL cache dedupes repeated calls within the refresh window, symbols are batched into a single quotes request, and a fallback provider fills any gaps so the UI never shows an empty table.
- **Graceful degradation.** If the live provider throws, the route falls back to snapshot data and surfaces a non-blocking warning banner. Missing per-field data renders as `N/A` rather than breaking the row.
- **Security.** The API key is read only from `process.env` on the server (Node runtime route handler) and is never serialized to the client.
- **Real-time updates.** The client refreshes every 15s via `setInterval`, deduping in-flight requests, pausing while the tab is hidden, and refreshing on focus to avoid wasted calls.
- **Correctness.** All portfolio math is isolated in pure functions in `lib/calculations.ts`, keeping the UI thin and the logic unit-testable.

### Known limitations

- BharatStock covers listed Indian equities; illiquid/unlisted holdings fall back to snapshot values.
- Fundamentals (P/E, EPS) are only as fresh as the provider's reporting cadence.
- Scraping Yahoo/Google directly was deliberately avoided in favor of a keyed, stable API.
