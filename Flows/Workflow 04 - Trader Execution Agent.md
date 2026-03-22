# Workflow 04 — Trader Execution Agent

**Status:** ⚠️ Partially Working — pipeline flows but cannot place real orders
**File:** `04-trader-agent.json`
**Schedule:** Every 15 minutes

## Flow

```
Schedule Trigger (15min)
  → Get Pending Recommendations (Supabase — executed=false, limit 1)
  → Check Current Positions via MCP (getPositions)
  → Check Account Balance via MCP (getAccountFutures USDT)
  → Combine Trader Context (Code — builds full prompt)
  → Trader AI Agent (GPT-5.4 — decision only)
  → Parse AI Response (Code — smart bracket-depth JSON extraction)
  → Save Execution Log (Supabase — trade_executions table)
  → Mark Recommendation Executed (Supabase — update executed=true)
```

## Critical Issue: No Trade Execution

The Trader AI Agent node is type `toolsAgent` but has **NO MCP tools connected** to its `ai_tool` input. It only has the OpenRouter Chat Model as `ai_languageModel`. This means:

- The AI generates text about what it *would* execute
- It **cannot** actually call MCP tools (addOrder, addStopOrder, etc.)
- All "executions" are theoretical — no real orders placed

## Recommended Fix (Option B — AI Decides, Code Executes)

Rather than connecting langchain tool nodes (unreliable with HTTP-based MCP), restructure so the AI only makes decisions and Code/HTTP nodes execute:

```
AI Decision Agent (outputs JSON plan)
  → Parse Execution Plan (Code node)
  → IF action = EXECUTE:
    → Get Ticker (verify price in range)
    → Get Symbol Detail (get lot size)
    → Calculate Position Size (Code node)
    → Place Entry Order (HTTP → MCP addOrder)
    → Place Stop Loss (HTTP → MCP addStopOrder)
    → Place Take Profit (HTTP → MCP addStopOrder)
    → Verify Position (HTTP → MCP getPositions)
  → Log Results + Mark Executed
```

See [[Development Roadmap]] Phase 1 for full implementation details.

## Parse AI Response (Smart Parser)

Uses bracket-depth tracking to extract individual JSON objects from AI output (which may contain tool-call JSON mixed in). Searches for the block containing the `"executions"` key.

## Additional Issue

KuCoin Futures account has essentially zero USDT balance (~1.12e-8). Must be funded before any real trading can occur.