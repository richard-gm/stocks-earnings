# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Commands

```bash
# Requires Node 20 via nvm
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && nvm use 20

npm run dev        # Start dev server (hot-reload, http://localhost:3000)
npm run build      # Production build
npx tsc --noEmit   # Type check only — run this after every change

# Docker
docker build -t stocks-earnings .
docker run -p 3000:3000 \
  -e TASTYTRADE_USERNAME=... \
  -e TASTYTRADE_PASSWORD=... \
  -e FMP_API_KEY=... \
  stocks-earnings
```

## Application Overview

Next.js 15 (App Router) fullstack tool for retail options traders. Three main features:

| Route | Purpose |
|---|---|
| `/` | Earnings move analyzer — compare implied vs actual post-earnings moves |
| `/flow` | Unusual options flow — detect whale positioning via volume/OI anomalies |
| `/twitter` | Twitter Intelligence — extract stock mentions from finance influencers using Claude |

---

## Architecture

### Data Flow — Earnings

```
User enters ticker → /[ticker] page
  → EarningsDashboard (client component)
  → GET /api/earnings/[ticker]
  → mock mode (no credentials): mockData.ts (GOOG/AAPL/MSFT/NVDA only)
  → live mode: Alpha Vantage (actual announcement dates + EPS) + yahoo-finance2 (historical prices)
               + TastyTrade (live ATM straddle for expected move)
  → PostEarningsPanel + StrategyTable + EarningsChart
```

### Data Flow — Options Flow

```
User enters ticker → /flow page
  → GET /api/flow/[ticker]
  → Polygon.io options snapshot (requires paid plan — free tier returns 403)
  → analyzeFlow() → unusualContracts flagged by high vol/OI ratio, large premium, sweep
```

### Data Flow — Twitter Intelligence

```
User selects/adds account → /twitter page
  → TwitterDashboard (client component)
  → GET /api/twitter/[username]?range=3m|6m
  → mock mode (no TWITTERAPI_IO_KEY): returns hardcoded chamath/elonmusk analyses
  → live mode:
      twitterapi.io → fetchUserTweets() [incremental — only since last cached fetch]
      → Claude API (claude-sonnet-4-6) → analyzeTweets() → structured ticker JSON
      → file cache written to data/twitter-cache/{username}-{range}.json
  → TwitterDashboard sets tickerInfo state via GET /api/ticker-info?symbols=...
      → FMP /api/v3/quote/ + /api/v3/stock-price-change/ (parallel)
      → price, 1D/3M/1Y returns, TradingView URL per ticker card
```

---

## Module Map

| Path | Purpose |
|---|---|
| `src/types/index.ts` | All shared domain types — edit here first before adding new features |
| `src/lib/env.ts` | Env var config; `isMockMode` flag (true when `TASTYTRADE_USERNAME` unset) |
| `src/lib/cache.ts` | In-memory TTL cache (Map-based). TTLs: 6h earnings, 5m options chain, 1h flow, 24h ticker-info |
| `src/lib/mockData.ts` | Pre-populated 13-quarter data for GOOG/AAPL/MSFT/NVDA |
| `src/lib/mockOiData.ts` | Mock OI data for GOOG/AAPL/MSFT/NVDA (OI live provider not yet integrated) |
| `src/lib/fmp/client.ts` | Alpha Vantage earnings dates — `getEarningsDates()` returns actual announcement dates + EPS (25 req/day free tier) |
| `src/lib/fmp/tickerInfo.ts` | FMP quote + price-change → price, 1D/3M/1Y returns, TradingView URL |
| `src/lib/yahoo/client.ts` | yahoo-finance2: historical prices per earnings window |
| `src/lib/tastytrade/client.ts` | TastyTrade JWT auth (module-level token, refreshed 30min before 24h expiry) |
| `src/lib/tastytrade/endpoints.ts` | getOptionChain, getMarketMetrics, getCurrentAtmStraddle |
| `src/lib/tastytrade/types.ts` | TastyTrade API response types |
| `src/lib/twitter/client.ts` | twitterapi.io wrapper — fetchUserTweets() with incremental pagination |
| `src/lib/twitter/analysis.ts` | Claude API call — analyzeTweets() → structured TickerMention[] + summary |
| `src/lib/twitter/fileCache.ts` | Persistent JSON cache in data/twitter-cache/ for raw tweets + analyses |
| `src/lib/calculations/actualMove.ts` | (priceAfter - priceBefore) / priceBefore |
| `src/lib/calculations/expectedMove.ts` | ATM straddle price / stock price; fallback: IV × sqrt(days/365) |
| `src/lib/calculations/strategyPnl.ts` | Straddle/strangle/butterfly/condor P&L simulation per quarter |
| `src/lib/calculations/unusualFlow.ts` | Flags contracts by high vol/OI ratio, large premium, top-N sweep |
| `src/app/api/earnings/[ticker]/route.ts` | Earnings orchestration — cache → mock → live (AV + Yahoo + TT) |
| `src/app/api/flow/[ticker]/route.ts` | Options flow — cache → Polygon snapshot → analyzeFlow() |
| `src/app/api/oi/[ticker]/route.ts` | Open interest over time — mock only (live provider not wired) |
| `src/app/api/ticker-info/route.ts` | Batch price/returns for ticker cards — cache → FMP |
| `src/app/api/twitter/[username]/route.ts` | Twitter analysis — mock → file cache → incremental live fetch → Claude |
| `src/app/api/health/route.ts` | Health probe for Docker/Cloud Run (`GET /api/health → 200 OK`) |
| `src/components/EarningsDashboard.tsx` | Client component; fetches earnings API and renders all panels |
| `src/components/EarningsChart.tsx` | Recharts ComposedChart with ErrorBar for ±expected move I-bars |
| `src/components/StrategyTable.tsx` | Options strategy P&L table (straddle/strangle/butterfly/condor) |
| `src/components/PostEarningsPanel.tsx` | Summary stats text panel (avg expected vs actual move) |
| `src/components/FlowTable.tsx` | Unusual contracts table — sortable, signal badges |
| `src/components/OpenInterestChart.tsx` | Call/put OI over time — Recharts AreaChart |
| `src/components/TwitterDashboard.tsx` | Twitter Intelligence UI — account sidebar, ticker cards, by-ticker tab |
| `src/data/twitter-accounts.ts` | Curated list of finance accounts shown in the sidebar |

---

## Key Design Decisions

- **Mock mode**: When `TASTYTRADE_USERNAME` is unset, earnings API returns pre-built mock data. Twitter mock mode triggers when `TWITTERAPI_IO_KEY` is unset (returns hardcoded chamath/elonmusk).
- **Caching layers**: In-memory Map (process lifetime) + file-based JSON (persistent across restarts, used for Twitter only). No Redis needed — Cloud Run single-instance deployment.
- **Twitter incremental fetch**: On each request, only tweets since `cachedAt` are fetched from twitterapi.io. New tweets are merged with stored ones before sending to Claude. Claude re-analysis only triggers when ≥20 new tweets arrive.
- **Claude prompt caching**: System prompt and user tweet block both tagged `cache_control: ephemeral` — saves ~400 tokens on repeat calls within Anthropic's 5-min TTL window.
- **Ticker info non-blocking**: `/api/ticker-info` is fetched client-side after analysis renders, so the UI never blocks on FMP. Cards show without price data then populate in a second pass.
- **Rate limiting**: 10 req/min per IP enforced at the API route level with an in-memory Map. Alpha Vantage 25/day limit: module-level `rateLimitedUntil` timestamp blocks re-attempts for 5 min after a limit hit.
- **TradingView URLs**: Built from FMP's `exchange` field — mapped via `EXCHANGE_MAP` in `src/lib/fmp/tickerInfo.ts`. Unknown exchanges fall back to symbol-only (TradingView auto-resolves most US tickers).
- **Expected move**: Live = ATM straddle price / stock price. Fallback (no TastyTrade) = IV × sqrt(1/365).

---

## Configuration

```bash
# .env.local (never commit)

# Earnings feature
TASTYTRADE_USERNAME=         # required for live earnings mode
TASTYTRADE_PASSWORD=
TASTYTRADE_BASE_URL=https://api.tastytrade.com
ALPHA_VANTAGE_API_KEY=       # free tier: 25 req/day — actual earnings announcement dates + EPS

# Ticker info (price, returns, TradingView links)
FMP_API_KEY=                 # Financial Modeling Prep — used for quote + price-change

# Twitter Intelligence
TWITTERAPI_IO_KEY=           # twitterapi.io — free tier: 1 req/5s
ANTHROPIC_API_KEY=           # Claude API for tweet analysis
ANTHROPIC_MODEL=claude-sonnet-4-6  # override if needed
```

---

## GCP Deployment

- **Service**: Cloud Run (`stocks-earnings`)
- **Registry**: Google Artifact Registry (`{REGION}-docker.pkg.dev/{PROJECT}/stocks-earnings/app`)
- **Secrets**: GCP Secret Manager injects `tastytrade-username`, `tastytrade-password`, `twitterapi-io-key`, `anthropic-api-key` at runtime
- **CI/CD**: Push to `main` → `.github/workflows/deploy.yml` → Docker build → Cloud Run deploy
- **GitHub Secrets required**: `GCP_SA_KEY`, `GCP_PROJECT_ID`, `GCP_REGION`, `GCP_RUN_SA_EMAIL`
- **Limits**: `--max-instances 2`, `--memory 512Mi`, `--min-instances 0` (cold start on first request)

---

## Known Limitations

| Area | Issue |
|---|---|
| Earnings history | Alpha Vantage free tier: 25 req/day. Returns actual announcement dates + EPS. With 6h TTL cache = 25 unique ticker lookups/day. |
| Options flow | `/flow` page shows static "requires paid Polygon plan" message — no live data source wired. |
| Open interest | `/api/oi/[ticker]` only serves mock data for GOOG/AAPL/MSFT/NVDA. Live provider not wired. |
| Earnings depth | FMP earnings-surprises returns ~20 quarters; calendar fallback fetches up to 80. |
| Twitter rate limit | twitterapi.io free tier: 1 req/5s. Client sleeps 5.5s between paginated pages. |
| yahoo-finance2 | Requires Node ≥22 but app runs on Node 20. Works with warnings — not tested on Node 22. |
