# Workflow 01 — Sentiment Agent

**Status:** ✅ Fully Working
**File:** `01-sentiment-agent.json`
**Schedule:** Every 1 hour

## Flow

```
Schedule Trigger (1h)
  → Fetch Crypto News Sentiment (Alpha Vantage HTTP)
  → Fetch Fear & Greed Index (alternative.me HTTP)
  → Combine Sentiment Data (Code node — builds prompt)
  → Sentiment AI Agent (GPT-5.4 via OpenRouter)
  → Parse AI Response (Code node — extracts JSON)
  → Save to Supabase (sentiment_reports table)
```

## What It Does

Fetches crypto news sentiment from Alpha Vantage (tickers: BTC, ETH, SOL) and the Fear & Greed Index from alternative.me. Feeds both datasets to GPT-5.4 which classifies overall market sentiment, identifies bullish/bearish coins, key themes, and risk events. Saves structured output to the `sentiment_reports` table.

## Output Format (saved to Supabase)

- `overall_sentiment` — bullish / bearish / neutral
- `strength` — 1 to 10
- `themes` — JSON array of narrative themes
- `bullish_coins` — JSON array e.g. `["BTC", "ETH"]`
- `bearish_coins` — JSON array e.g. `["XRP"]`
- `risk_events` — JSON array of flagged risks
- `summary` — 2-sentence market summary