# Workflow 03 — Analyst Agent

**Status:** ✅ Working
**File:** `03-analyst-agent.json`
**Schedule:** Every 1 hour

## Flow

```
Schedule Trigger (1h)
  → Get Latest Sentiment (Supabase — last 3 reports)
  → Get Latest Chart Analysis (Supabase — last 6 analyses)
  → Get Current Positions via MCP (getPositions)
  → Get Account Balance via MCP (getAccountFutures USDT)
  → Combine All Data (Code — builds full prompt with trading rules)
  → Analyst AI Agent (GPT-5.4)
  → Parse AI Response (Code)
  → Save to Supabase (trade_recommendations table)
```

## Trading Rules (Embedded in Prompt)

- Maximum 3 concurrent positions
- Maximum 2% of account balance risk per trade
- Only trade symbols with technical confidence >= 6
- Sentiment and technicals must align (both bullish for long, both bearish for short)
- If sentiment is neutral, only take trades with technical confidence >= 8
- Always set stop-loss and take-profit levels
- Never increase a losing position
- Maximum leverage: 10x
- If account drawdown > 10%, reduce position sizes by 50%