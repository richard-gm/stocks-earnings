# Stocks Earnings Analyzer

A fullstack Next.js tool for retail options traders. Three integrated features:

1. **Earnings Move Analyzer** — compare the market-implied expected move vs actual post-earnings price action across historical quarters, then simulate how straddle/strangle/condor strategies would have performed.
2. **Unusual Options Flow** — surface whale positioning via volume/open-interest anomalies in real-time options snapshots.
3. **Twitter Intelligence** — scrape finance influencers, run tweets through Claude to extract structured stock recommendations (ticker, sentiment, signal, key quotes), and display price/return context per ticker.

---

## Getting Started

### Prerequisites

- Node.js 20 (via nvm)
- A Financial Modeling Prep API key (free tier — ticker price/returns)
- Optional: TastyTrade credentials, Alpha Vantage key (earnings live mode), Twitter session cookies (JSON), Anthropic key

### Local development

```bash
# Use Node 20
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && nvm use 20

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local   # then fill in values (see Environment Variables below)

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Mock mode**: if `TASTYTRADE_USERNAME` is not set, the earnings page works with pre-built data for GOOG, AAPL, MSFT, NVDA. If `TWITTER_COOKIES_FILE` is not set, the Twitter page shows hardcoded analyses for `chamath` and `elonmusk`.

### Type check

```bash
npx tsc --noEmit
```

### Docker

```bash
docker build -t stocks-earnings .
docker run -p 3000:3000 \
  -e TASTYTRADE_USERNAME=your_user \
  -e TASTYTRADE_PASSWORD=your_pass \
  -e FMP_API_KEY=your_key \
  stocks-earnings
```

---

## Environment Variables

Create `.env.local` (never commit this file):

```bash
# Earnings feature — live mode
TASTYTRADE_USERNAME=          # TastyTrade account email
TASTYTRADE_PASSWORD=          # TastyTrade account password
TASTYTRADE_BASE_URL=https://api.tastytrade.com

# Historical earnings dates + EPS — actual announcement dates, free: 25 req/day
ALPHA_VANTAGE_API_KEY=        # https://www.alphavantage.co/support/#api-key

# Ticker price + returns on Twitter Intelligence cards
FMP_API_KEY=                  # https://financialmodelingprep.com/developer/docs

# Twitter Intelligence — live mode
# Export your x.com browser session cookies as JSON using the "Cookie-Editor"
# browser extension (Export → JSON), then save the file locally.
TWITTER_COOKIES_FILE=./config/twitter-cookies.json   # path to exported cookie JSON
ANTHROPIC_API_KEY=            # https://console.anthropic.com
ANTHROPIC_MODEL=claude-sonnet-4-6   # optional override
```

---

## Pages

| URL | Description |
|---|---|
| `/` | Home — ticker search for earnings analysis |
| `/[ticker]` | Earnings dashboard for a specific stock (e.g. `/AAPL`) |
| `/flow` | Unusual options flow — enter a ticker to see flagged contracts |
| `/twitter` | Twitter Intelligence — load finance accounts, view stock recommendations |

---

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/earnings/[ticker]` | Historical earnings + strategy P&L. Mock mode for GOOG/AAPL/MSFT/NVDA |
| `GET /api/flow/[ticker]` | Options snapshot → unusual contracts. Requires paid Polygon plan |
| `GET /api/oi/[ticker]` | Open interest over time. Mock only (GOOG/AAPL/MSFT/NVDA) |
| `GET /api/ticker-info?symbols=A,B,C` | Batch price + 1D/3M/1Y returns + TradingView URL. Uses FMP |
| `GET /api/twitter/[username]?range=3m\|6m` | Tweet analysis via Claude. Mock mode when no API key set |
| `GET /api/health` | Health check for Cloud Run / Docker |

---

## Deployment (GCP Cloud Run)

The app deploys automatically on every push to `main` via GitHub Actions.

### Required GitHub Secrets

| Secret | Description |
|---|---|
| `GCP_SA_KEY` | Service account JSON key with Artifact Registry + Cloud Run permissions |
| `GCP_PROJECT_ID` | GCP project ID |
| `GCP_REGION` | e.g. `us-central1` |
| `GCP_RUN_SA_EMAIL` | Service account email used by the Cloud Run service |

### Required GCP Secret Manager secrets

These are injected at runtime by Cloud Run:

- `tastytrade-username`
- `tastytrade-password`
- `twitter-cookies` — full JSON content of your exported x.com browser cookies (see **Twitter cookies** below)
- `anthropic-api-key`

### Twitter cookies

The Twitter Intelligence feature authenticates using your personal x.com browser session rather than a paid API. To set this up:

1. Install the [Cookie-Editor](https://chrome.google.com/webstore/detail/cookie-editor/hlkenndednhfkekhgcdicdfddnkalmdm) browser extension
2. Log in to [x.com](https://x.com) in your browser
3. Open Cookie-Editor, click **Export → Export as JSON**, and copy the result
4. **Local dev**: save the JSON to `config/twitter-cookies.json` and set `TWITTER_COOKIES_FILE=./config/twitter-cookies.json` in `.env.local`
5. **Cloud Run**: create a GCP Secret Manager secret named `twitter-cookies` with the JSON as its value; the deploy workflow mounts it to `/secrets/twitter-cookies.json` and sets `TWITTER_COOKIES_FILE` automatically

> **Note**: Browser sessions expire. If Twitter returns a 401/403, re-export your cookies and redeploy.

The cookie file is gitignored — never commit it.

### Manual deploy

```bash
# Build and push
gcloud builds submit --tag REGION-docker.pkg.dev/PROJECT/stocks-earnings/app

# Deploy
gcloud run deploy stocks-earnings \
  --image REGION-docker.pkg.dev/PROJECT/stocks-earnings/app:latest \
  --region REGION \
  --platform managed \
  --allow-unauthenticated
```

---

## TODO / Roadmap

### High priority

#### Change in % from where the stock reported profits by 5-10-15days.
This will give us a great indication if we can buy short calls (eg 1 week or 3months calls for given stock. For instance SWKS stock its a great example, 1-2 days before earnings is a great place to buy it, the stock runs up 20 %, we can also analyse 5-10 before the stock earnings to see if stocks tend to go up pre earnins and thhen sell out. This can give us a breakdown of what to do for given stock and then analyse the data. (if its easier we can start by using just one stock, get the raw data in json or csv and then analysing the data with a LLM so that we can modify if neede. 
For reference look at the /Users/richardguaman/Documents/ai_projects/stocks_earnings/resources_for_LLM/table_options.png file to undertand what we want to do. Ask clarification questions.
THIS IS THE TOP priority, implement asap
 
#### Earnings data depth — more than 20 quarters
**Status**: Alpha Vantage is the current source (`src/lib/fmp/client.ts` → `getEarningsDates()`). Returns actual earnings announcement dates + EPS for ~13–20 quarters. Free tier: 25 req/day. With 6h TTL cache this covers ~25 unique ticker lookups/day — sufficient for personal use.

**Investigated alternatives** (all ruled out):
- **FMP** `earnings-surprises` → requires paid plan (403 on free tier)
- **Finnhub** `/calendar/earnings` → free tier silently returns empty arrays for historical data
- **Finnhub** `/stock/earnings` → returns fiscal quarter END dates (not announcement dates); breaks price-window lookup
- **Yahoo Finance** `earningsHistory` → only ~4 quarters; `quarter` field is fiscal period end, not announcement date

**If 25 req/day becomes a bottleneck**: upgrade Alpha Vantage plan ($50/mo removes the cap) or evaluate Market Chameleon (deep history, scraping-only, no public API).

---

#### Open interest — support any ticker ⬅ next up
**Problem**: `GET /api/oi/[ticker]` only returns mock data for 4 hardcoded tickers (GOOG, AAPL, MSFT, NVDA). Any other ticker (e.g. IREN, TSLA, MU) returns 404: "No OI data available."

**Root cause**: `src/lib/mockOiData.ts` only generates deterministic seeded data for those 4 symbols. `src/app/api/oi/[ticker]/route.ts` returns 404 for everything else.

**Short-term fix** (no live provider needed):
- Make `getMockOiResponse()` in `src/lib/mockOiData.ts` accept any symbol by seeding the random generator from the symbol string hash instead of a hardcoded symbol list. This gives every ticker a plausible-looking (but fake) OI chart with a visible "Simulated data" disclaimer in the UI.

**Long-term fix** (real data):
- **Finnhub** `GET /stock/option-chain?symbol={symbol}&limit=20&token={key}` — returns a per-symbol option chain snapshot (total call/put OI per expiry). Free tier available. Could snapshot daily and store in file cache to build timeseries.
- **CBOE** publishes daily OI CSV files at `cboe.com/us/equities/market_statistics/historical_data` — free, no API key, but requires CSV parsing and scheduling.
- **Yahoo Finance** `quoteSummary` `options` module — returns current option chain with OI per contract. Same limitation as Finnhub: snapshot only, needs daily scheduling to build history.

**Files to change**: `src/lib/mockOiData.ts`, `src/app/api/oi/[ticker]/route.ts`, optionally `src/components/OpenInterestChart.tsx` (add simulated disclaimer).

---

#### Twitter Intelligence — expand curated accounts list
**File**: `src/data/twitter-accounts.ts`

Add more well-known finance accounts. Currently only `aleabitoreddit` is listed. Suggested additions: `chamath`, `elonmusk` (already in mock data), `fundstrat`, `zerohedge`, etc. Each entry needs `{ username, displayName, description }`.

---

### Medium priority

#### Filter/sort bar on Twitter ticker cards
**File**: `src/components/TwitterDashboard.tsx` → `AccountPanel`

Add a row of filter buttons above the ticker card list:
- Filter by signal: `BUY only`, `SELL only`, `All`
- Filter by sentiment: `Bullish`, `Bearish`, `All`
- Sort by: `Mention count`, `Alphabetical`

State lives in `AccountPanel`. No API changes needed.

---

#### Mention count visual bar
**File**: `src/components/TwitterDashboard.tsx` → `TickerCard`

Add a thin horizontal bar below each ticker name proportional to `mention.mentionCount / maxMentions`. Requires passing `maxMentions` from `AccountPanel` down to each `TickerCard`.

---

#### Earnings strategy P&L — use real ATM straddle prices
**Problem**: When TastyTrade is connected, `getCurrentAtmStraddle()` in `src/lib/tastytrade/endpoints.ts` fetches the *current* straddle. But historical entries in `src/lib/yahoo/client.ts` all fall back to `ivProxyExpectedMove(0.35, 1)` — a hardcoded IV of 35%. Historical ATM prices are not available from TastyTrade.

**Fix**: Add a historical IV source. Options:
- FMP `/api/v4/historical-price-full/{symbol}?serietype=line` doesn't include IV.
- Market Chameleon has historical IV data.
- Polygon `/v2/aggs/ticker/{optionsTicker}/range/...` for historical option prices if on paid plan.

---

#### Node.js version upgrade
**Problem**: `yahoo-finance2` requires Node ≥22. The app runs on Node 20 (prints a warning on startup). Cloud Run image uses `node:20-alpine`.

**Fix**: Bump `FROM node:20-alpine` → `FROM node:22-alpine` in `Dockerfile`, update `.nvmrc` if present, test that the yahoo-finance2 calls work correctly on Node 22.

---

#### Alpha Vantage → better source (ongoing)
Investigated FMP, Finnhub, and Yahoo Finance. All free alternatives either require paid plans or return fiscal period end dates instead of actual announcement dates (which breaks the price-window lookup). Alpha Vantage remains the only free source with actual announcement dates for 13–20 quarters. See "Earnings data depth" above for full findings.

---

### Low priority / future

- **Persistent cache across restarts**: Twitter file cache already persists in `data/twitter-cache/`. Earnings and options data could be persisted similarly to survive Cloud Run cold starts.
- **Alerts / notifications**: Email or push alert when a watched ticker has unusual flow or a tracked Twitter account posts a new BUY signal.
- **Portfolio view**: Cross-account view in Twitter Intelligence showing all BUY signals across all loaded accounts in one table, sortable by confidence/mention count.
- **Backtesting**: Given earnings history and strategy P&L per quarter, add a cumulative P&L chart showing what a systematic straddle-selling strategy would have returned over N quarters.
- **CBOE/OCC historical OI backfill**: CBOE publishes daily OI files. Could backfill the OI chart with real historical data for free.

---

## Known Issues

| Issue | File | Notes |
|---|---|---|
| Alpha Vantage 25 req/day cap | `src/lib/fmp/client.ts` | 5-min module-level backoff after limit hit. With 6h TTL cache: ~25 unique tickers/day. |
| OI endpoint mock-only | `src/app/api/oi/[ticker]/route.ts` | Returns 404 for any ticker outside GOOG/AAPL/MSFT/NVDA. Fix tracked in TODO above. |
| Options flow has no live source | `src/app/api/flow/[ticker]/route.ts` | Polygon was removed (required paid plan). Route returns 402 for all tickers. |
| `yahoo-finance2` Node version warning | `src/lib/yahoo/client.ts` | Requires Node ≥22, app runs on 20. Works but prints warning. |
| Duplicate tickers from Claude | `src/components/TwitterDashboard.tsx` | Deduplicated client-side with `.filter()` on first index. |
| TradingView URL for unknown exchanges | `src/lib/fmp/tickerInfo.ts` | Falls back to symbol-only if exchange not in `EXCHANGE_MAP`. Usually resolves correctly. |
