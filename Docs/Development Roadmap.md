# Development Roadmap

Ordered by priority. Each phase builds on the previous one.

## Phase 1: CRITICAL — Enable Actual Trade Execution

### 1.1 Restructure Workflow 04 (Option B: AI Decides, Code Executes)

The n8n langchain AI Agent cannot reliably call external HTTP-based MCP tools. Instead:

1. **Keep AI Agent** but change role to decision-making only — outputs a JSON execution plan
2. **Add Parse Execution Plan** (Code node) — extracts planned actions
3. **Add HTTP Request nodes** for each action type:
   - Place Entry Order → `addOrder`
   - Place Stop Loss → `addStopOrder`
   - Place Take Profit → `addStopOrder`
4. **Add Verify Execution** node → calls `getPositions` to confirm
5. **Add error handling** — if any order fails, call `cancelAllOrders` for that symbol

New flow:
```
AI Decision Agent → Parse Plan → IF EXECUTE:
  → Get Ticker (verify price)
  → Get Symbol Detail (lot size)
  → Calculate Position Size (Code)
  → Place Entry (HTTP → MCP)
  → Place SL (HTTP → MCP)
  → Place TP (HTTP → MCP)
  → Verify (HTTP → MCP)
→ Log + Mark Executed
```
Position size calculation:
```javascript
Math.floor((balance * pct / 100) / (price / leverage) / lotSize) * lotSize
```

### 1.2 Fund KuCoin Futures Account

- Transfer USDT to KuCoin Futures (current balance: ~0)
- Start with a small test amount (e.g. 50 USDT)
- **Manual step** — Spud must do this from KuCoin app/web

### 1.3 Add Safety Checks

- Kill switch (Supabase row or env var to disable all trading)
- Max daily loss limit (e.g. 5% of account)
- Max single trade loss limit (e.g. 2%)
- Duplicate order detection (don't open same direction on same symbol twice)

---

## Phase 2: HIGH — Technical Indicator Calculator

### 2.1 Create Workflow 02b — Indicator Calculator

**New file:** `02b-indicator-calculator.json`
**Schedule:** Every 10 minutes (after chart data fetched)

Uses **Code nodes** (pure JS math) to calculate:
- RSI(14) — Wilder smoothing
- MACD(12, 26, 9) — EMA-based
- Bollinger Bands(20, 2)
- SMA(20, 50, 200)
- EMA(12, 26)
- OBV (On-Balance Volume)
- ATR(14)
Saves to new `technical_indicators` table. Needs 200+ candles for SMA-200.

### 2.2 Update Workflows 02 and 03

- Modify Chart Analysis AI prompt to include pre-calculated indicators
- AI focuses on pattern recognition, not calculation
- Add "Get Latest Indicators" node to Analyst workflow

---

## Phase 3: HIGH — Twitter/X Sentiment

### 3.1 Evaluate Data Source

Options (in preference order):
1. **Twitter/X API v2** — Official, Basic tier ~$100/mo
2. **Apify Twitter Scraper** — Pay-per-use, no API key
3. **LunarCrush** — Pre-aggregated crypto social sentiment
4. **RapidAPI wrappers** — Third-party Twitter endpoints

### 3.2 Add to Workflow 01

- New HTTP Request node before "Combine Sentiment Data"
- Fetch recent tweets for $BTC, $ETH, crypto keywords
- Filter for accounts with >1000 followers
- Add `## Twitter Sentiment Data` section to AI prompt

---

## Phase 4: MEDIUM — Perplexity AI Market Research

- Perplexity API: `https://api.perplexity.ai/chat/completions`
- Model: `llama-3.1-sonar-large-128k-online` (includes web search)
- Ask: "Major crypto developments and upcoming events for [coins] in next 24-48h?"
- Feed into Analyst Agent via new Supabase table or embedded in sentiment

---

## Phase 5: MEDIUM — On-Chain Data

Options: Glassnode, IntoTheBlock, CryptoQuant, Santiment, DeFiLlama (free)

Key metrics to fetch:
- Whale transaction alerts (large transfers to/from exchanges)
- Exchange net flows (net deposits = bearish, net withdrawals = bullish)
- Active addresses and network activity

---

## Phase 6: MEDIUM — Trade Analyzer / Performance Audit

### 6.1 Create Workflow 05 — Trade Analyzer

**New file:** `05-trade-analyzer.json`
**Schedule:** Every 6 hours

Calculates: win rate, avg win vs avg loss, Sharpe ratio, max drawdown, profit factor, avg holding period, best/worst symbols. AI Performance Coach analyses patterns and suggests adjustments.

---

## Phase 7: LOW — Advanced Optimisations

- **Multi-symbol per run** — process all symbols in parallel instead of rotating
- **Confidence-based sizing** — 8-10: full 2% risk, 6-7: half 1% risk, <6: no trade
- **Multi-agent trader** — Account Agent (risk checks) + Executor Agent (orders)
- **Alert system** — Telegram/Discord/email on trade execution, SL hit, daily P&L
- **Backtesting** — replay historical data through same AI agents, tune prompts