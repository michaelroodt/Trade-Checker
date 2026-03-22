# Workflow 02 — Chart Analysis Agent

**Status:** ✅ Working
**File:** `02-chart-analysis-agent.json`
**Schedule:** Every 10 minutes

## Flow

```
Schedule Trigger (10min)
  → Get Latest Sentiment (Supabase — reads bullish/bearish coins)
  → Prepare MCP Requests (Code — maps coins to futures symbols, rotates)
  → Fetch 1H Klines via MCP (HTTP POST)
  → Fetch 1D Klines via MCP (HTTP POST)
  → Fetch Ticker via MCP (HTTP POST)
  → Combine Chart Data (Code — builds full prompt)
  → Chart Analysis AI Agent (GPT-5.4)
  → Parse AI Response (Code)
  → Save to Supabase (chart_analysis table)
```

## Dynamic Symbol Selection

Reads `bullish_coins` and `bearish_coins` from the latest sentiment report. Maps coin names to KuCoin futures symbols using a lookup table (BTC→XBTUSDTM, ETH→ETHUSDTM, etc.). Falls back to BTC/ETH/SOL if sentiment data is empty.

Processes **one symbol per run** using time-based rotation:
```javascript
const index = Math.floor(Date.now() / 600000) % symbols.length;
```