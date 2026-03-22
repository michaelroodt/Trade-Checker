# Spud Trade-Checker

> AI-Powered Crypto Futures Trading Agent for KuCoin

## What It Does

Trade-Checker is an autonomous crypto futures trading system that monitors the market, analyses sentiment and technicals, generates trade recommendations, and (once fully built) executes trades on KuCoin Futures — all without human intervention.

The system runs on **n8n** (self-hosted workflow automation) with AI agents powered by **GPT-5.4** via OpenRouter. Market data comes from the **KuCoin Futures API** through a custom **MCP server** deployed as a Supabase Edge Function. All data is stored in **Supabase Postgres**.

## Architecture

The pipeline runs as 4 sequential n8n workflows:

```
01 Sentiment Agent (hourly)
   → Fetches news + Fear & Greed Index
   → AI classifies market mood
   → Saves to sentiment_reports table
        ↓
02 Chart Analysis Agent (every 10 min)
   → Reads sentiment to pick coins dynamically
   → Fetches OHLCV data from KuCoin via MCP
   → AI analyses charts
   → Saves to chart_analysis table
        ↓
03 Analyst Agent (hourly)
   → Reads sentiment + charts + positions + balance
   → AI generates trade recommendations
   → Saves to trade_recommendations table
        ↓
04 Trader Execution Agent (every 15 min)
   → Reads pending recommendations
   → Checks positions and balance
   → AI decides whether to execute
   → Logs to trade_executions table
```

## Current Status

| Component | Status |
|-----------|--------|
| MCP Server (KuCoin API) | ✅ Working |
| Workflow 01 — Sentiment | ✅ Working |
| Workflow 02 — Chart Analysis | ✅ Working |
| Workflow 03 — Analyst | ✅ Working |
| Workflow 04 — Trader | ⚠️ Partial — cannot place real orders yet |
| KuCoin account funding | ❌ Account has ~0 USDT |

## Key Links

- **n8n instance:** https://n8n.roodtsquared.co.uk/
- **Supabase project:** https://supabase.com/dashboard/project/cnglbxgnswjrdmuluwzy
- **MCP server endpoint:** `https://cnglbxgnswjrdmuluwzy.supabase.co/functions/v1/mcp-server`
- **Based on:** Moritz Braun's LinkedIn article on autonomous AI trading agents

## Related Pages

- [[Workflow 01 - Sentiment Agent]]
- [[Workflow 02 - Chart Analysis Agent]]
- [[Workflow 03 - Analyst Agent]]
- [[Workflow 04 - Trader Execution Agent]]
- [[MCP Server]]
- [[Database Schema]]
- [[Credentials and Config]]
- [[Development Roadmap]]
- [[Technical Patterns]]