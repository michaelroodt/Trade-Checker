# MCP Server

**Status:** ✅ Working
**Runtime:** Supabase Edge Function (Deno)
**Protocol:** JSON-RPC 2.0 (MCP standard)
**Endpoint:** `https://cnglbxgnswjrdmuluwzy.supabase.co/functions/v1/mcp-server`

## Authentication (Three Headers Required)

Every request to the MCP server needs these headers:

```
Authorization: Bearer <supabase-anon-jwt>
apikey: <supabase-anon-jwt>
X-MCP-Auth-Key: <mcp-auth-key>
Content-Type: application/json
```

The first two pass the Supabase gateway. The third authenticates at the function level.

## Request Format

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "getTicker",
    "arguments": { "symbol": "XBTUSDTM" }
  }
}
```

## Available Tools (20 total)

### Public Endpoints (no KuCoin API key needed)
| Tool | Description |
|------|-------------|
| `getSymbols` | List all active futures contracts |
| `getTicker` | Real-time ticker for a symbol |
| `getOrderBook` | Order book depth (top 20) |
| `getKlines` | OHLCV candlestick data |
| `getSymbolDetail` | Contract specs (tick/lot size, max leverage) |
| `getFundingRate` | Current funding rate |
| `getFundingHistory` | Historical funding rates |

### Private Endpoints (KuCoin API key required)
| Tool | Description |
|------|-------------|
| `addOrder` | Place market/limit order |
| `cancelOrder` | Cancel order by ID |
| `cancelAllOrders` | Cancel all orders (optionally by symbol) |
| `getOrders` | List orders with filters |
| `getOrderById` | Get specific order details |
| `addStopOrder` | Place stop-loss/take-profit order |
| `getOpenOrders` | Count of open orders |
| `getFills` | Executed trade fills |
| `getPositions` | All open positions |
| `getPosition` | Position for one symbol |
| `modifyMargin` | Add/remove margin |
| `getPositionsHistory` | Closed position history |
| `getAccountFutures` | Account balance/margin overview |

## Key Files

- `api/mcp.ts` — Main endpoint (JSON-RPC router, auth, CORS)
- `lib/tools.ts` — Tool definitions with Zod validation
- `lib/kucoin-client.ts` — KuCoin API client with HMAC-SHA256 signing