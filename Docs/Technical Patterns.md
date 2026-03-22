# Technical Patterns

Hard-won patterns discovered during development. Follow these in all future work.

## 1. Prompt Building in Code Nodes

n8n expressions `{{ $json.xxx }}` do **NOT** resolve inside langchain agent `text` or `systemMessage` fields when placed directly.

**Pattern:** Build the entire prompt in a Code node using JS template literals, return as `{ json: { prompt: string } }`, then reference in the AI Agent as `={{ $json.prompt }}`.

## 2. Supabase Field Mapping

When importing workflow JSON, Supabase node field mappings **must** use `fieldId` (not `fieldName`).

```json
{ "fieldId": "executed", "fieldValue": "={{ $json.executed }}" }
```

Using `fieldName` causes "Could not find the '' column" errors.

## 3. Supabase Filter Expressions

Filter strings **must** be prefixed with `=` to evaluate as n8n expressions.

```
"filterString": "=id=eq.{{ $('Node Name').first().json.id }}"
```

Without `=`, the expression is sent as literal text.

## 4. MCP Three-Header Auth

Every HTTP Request node calling the MCP server needs:
1. `Authorization: Bearer <supabase-anon-jwt>`
2. `apikey: <supabase-anon-jwt>`
3. `X-MCP-Auth-Key: <mcp-auth-key>`

AND `"method": "POST"` must be explicit — n8n defaults to GET.

## 5. Single Symbol Per MCP Call

KuCoin MCP tools accept a single symbol string (e.g. `"XBTUSDTM"`), NOT comma-separated. Process one symbol at a time.

## 6. Smart JSON Parser (Bracket-Depth)

AI output often contains tool-call JSON mixed with the actual response. Simple regex `/{[\s\S]*}/` breaks. Use bracket-depth tracking to find individual `{}` blocks, then search for the one with the expected key (e.g. `"executions"`).

## 7. Symbol Mapping

Map coin names to KuCoin futures symbols:
- `BTC` → `XBTUSDTM` (special case)
- Most others: append `USDTM` (e.g. `ETH` → `ETHUSDTM`)
- Full map includes 20+ coins with fallback to BTC/ETH/SOL