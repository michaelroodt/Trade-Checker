# Database Schema

**Database:** Supabase Postgres (project `cnglbxgnswjrdmuluwzy`)
**Schema file:** `n8n-workflows/00-database-schema.sql`

## Current Tables

### sentiment_reports (Workflow 01 output)
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | Auto-generated |
| overall_sentiment | VARCHAR(10) | bullish / bearish / neutral |
| strength | INTEGER | 1-10 |
| themes | JSONB | Array of narrative themes |
| bullish_coins | JSONB | e.g. `["BTC","ETH"]` |
| bearish_coins | JSONB | e.g. `["XRP"]` |
| risk_events | JSONB | Array of flagged risks |
| summary | TEXT | 2-sentence summary |
| created_at | TIMESTAMPTZ | Auto-generated |

### chart_analysis (Workflow 02 output)
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | Auto-generated |
| symbol | VARCHAR(20) | e.g. `XBTUSDTM` |
| current_price | DECIMAL(20,8) | |
| trend_1h, trend_1d | VARCHAR(10) | bullish / bearish / neutral |
| rsi_14 | DECIMAL(5,2) | AI-estimated currently |
| macd_signal | VARCHAR(10) | |
| ema_alignment | VARCHAR(10) | |
| technical_bias | VARCHAR(10) | long / short / neutral |
| confidence | INTEGER | 1-10 |
| support_levels | JSONB | |
| resistance_levels | JSONB | |
| patterns_detected | JSONB | |
| volume_trend | VARCHAR(15) | |
| summary | TEXT | |
| created_at | TIMESTAMPTZ | Auto-generated |

### trade_recommendations (Workflow 03 output)
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | Auto-generated |
| recommendations | JSONB | Array of trade recs |
| position_management | JSONB | Existing position actions |
| market_outlook | TEXT | 2-sentence outlook |
| risk_level | VARCHAR(10) | low / medium / high |
| executed | BOOLEAN | Default FALSE, set TRUE by WF04 |
| created_at | TIMESTAMPTZ | Auto-generated |

### trade_executions (Workflow 04 output)
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | Auto-generated |
| recommendation_id | UUID FK | → trade_recommendations.id |
| executions | JSONB | What was executed |
| errors | JSONB | Any errors encountered |
| created_at | TIMESTAMPTZ | Auto-generated |