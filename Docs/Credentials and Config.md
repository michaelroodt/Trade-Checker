# Credentials and Config

All secrets are stored in **1Password**. Never hardcode credentials in workflow JSON files.

## Supabase

| Item | Where It's Used |
|------|----------------|
| Anon Key (JWT) | HTTP Request headers (`Authorization` + `apikey`) in workflows 02, 03, 04 |
| n8n Credential | "Spud-Projects" (id: `ZKYVG5CaoZ0SZ0YM`) — used by all Supabase nodes |
| Project Ref | `cnglbxgnswjrdmuluwzy` |

## KuCoin Futures API

| Item | Where It's Used |
|------|----------------|
| API Key | Supabase Edge Function secret `KUCOIN_API_KEY` |
| API Secret | Supabase Edge Function secret `KUCOIN_API_SECRET` |
| API Passphrase | Supabase Edge Function secret `KUCOIN_API_PASSPHRASE` |
| Trading Password | For manual operations only |

To update KuCoin credentials: Supabase Dashboard → Project Settings → Edge Functions → Secrets

## MCP Server Auth

| Item | Where It's Used |
|------|----------------|
| MCP Auth Key | `X-MCP-Auth-Key` header in all HTTP Request nodes |
| Also set as | Supabase Edge Function secret `MCP_AUTH_KEY` |

## OpenRouter (LLM)

| Item | Where It's Used |
|------|----------------|
| n8n Credential | "OpenRouter account" (id: `mUDQbW9lzcsO8Uoh`) |
| Model | `openai/gpt-5.4` — used by all AI Agent nodes |