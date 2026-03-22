/**
 * KuCoin Futures API Client
 * Handles authentication (HMAC-SHA256) and all API calls to KuCoin Futures.
 */

const KUCOIN_BASE_URL = "https://api-futures.kucoin.com";

interface KuCoinCredentials {
  apiKey: string;
  apiSecret: string;
  apiPassphrase: string;
}

function getCredentials(): KuCoinCredentials {
  const apiKey = process.env.KUCOIN_API_KEY;
  const apiSecret = process.env.KUCOIN_API_SECRET;
  const apiPassphrase = process.env.KUCOIN_API_PASSPHRASE;
  if (!apiKey || !apiSecret || !apiPassphrase) {
    throw new Error("Missing KuCoin API credentials in environment variables");
  }
  return { apiKey, apiSecret, apiPassphrase };
}

async function hmacSha256(key: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

async function signRequest(
  method: string,
  path: string,
  body: string,
  credentials: KuCoinCredentials
): Promise<Record<string, string>> {
  const timestamp = Date.now().toString();
  const message = timestamp + method.toUpperCase() + path + body;
  const signature = await hmacSha256(credentials.apiSecret, message);
  const passphrase = await hmacSha256(credentials.apiSecret, credentials.apiPassphrase);

  return {
    "KC-API-KEY": credentials.apiKey,
    "KC-API-SIGN": signature,
    "KC-API-TIMESTAMP": timestamp,
    "KC-API-PASSPHRASE": passphrase,
    "KC-API-KEY-VERSION": "2",
    "Content-Type": "application/json",
  };
}

export async function kucoinRequest(
  method: string,
  path: string,
  params?: Record<string, unknown>
): Promise<unknown> {
  const credentials = getCredentials();
  let url = `${KUCOIN_BASE_URL}${path}`;
  let body = "";

  if (method === "GET" && params) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) qs.append(k, String(v));
    }
    const queryString = qs.toString();
    if (queryString) url += `?${queryString}`;
  } else if (method !== "GET" && params) {
    body = JSON.stringify(params);
  }

  const pathWithQuery = url.replace(KUCOIN_BASE_URL, "");
  const headers = await signRequest(method, pathWithQuery, body, credentials);

  const response = await fetch(url, {
    method,
    headers,
    body: method !== "GET" ? body || undefined : undefined,
  });

  const data = await response.json();
  if (data.code && data.code !== "200000") {
    throw new Error(`KuCoin API error ${data.code}: ${data.msg}`);
  }
  return data.data;
}

// ─── Market Data ───────────────────────────────────────────

export async function getSymbols() {
  return kucoinRequest("GET", "/api/v1/contracts/active");
}

export async function getTicker(symbol: string) {
  return kucoinRequest("GET", "/api/v1/ticker", { symbol });
}

export async function getOrderBook(symbol: string, depth?: number) {
  return kucoinRequest("GET", "/api/v1/level2/depth20", { symbol });
}

export async function getKlines(symbol: string, granularity: number, from?: number, to?: number) {
  return kucoinRequest("GET", "/api/v1/kline/query", { symbol, granularity, from, to });
}

export async function getSymbolDetail(symbol: string) {
  return kucoinRequest("GET", `/api/v1/contracts/${symbol}`);
}

// ─── Order Management ──────────────────────────────────────

export async function addOrder(params: {
  symbol: string;
  side: "buy" | "sell";
  type: "limit" | "market";
  size: number;
  price?: number;
  leverage: number;
  clientOid?: string;
  stop?: "down" | "up";
  stopPriceType?: "TP" | "IP" | "MP";
  stopPrice?: number;
  reduceOnly?: boolean;
  closeOrder?: boolean;
  forceHold?: boolean;
  marginMode?: "ISOLATED" | "CROSS";
  postOnly?: boolean;
  hidden?: boolean;
  iceberg?: boolean;
  visibleSize?: number;
  timeInForce?: "GTC" | "IOC";
}) {
  const clientOid = params.clientOid || `mcp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return kucoinRequest("POST", "/api/v1/orders", { ...params, clientOid });
}

export async function cancelOrder(orderId: string) {
  return kucoinRequest("DELETE", `/api/v1/orders/${orderId}`);
}

export async function cancelAllOrders(symbol?: string) {
  return kucoinRequest("DELETE", "/api/v1/orders", symbol ? { symbol } : undefined);
}

export async function getOrders(params?: {
  symbol?: string;
  status?: "active" | "done";
  side?: "buy" | "sell";
  type?: "limit" | "market";
}) {
  return kucoinRequest("GET", "/api/v1/orders", params as Record<string, unknown>);
}

export async function getOrderById(orderId: string) {
  return kucoinRequest("GET", `/api/v1/orders/${orderId}`);
}

export async function addStopOrder(params: {
  symbol: string;
  side: "buy" | "sell";
  type: "limit" | "market";
  size: number;
  stop: "down" | "up";
  stopPriceType: "TP" | "IP" | "MP";
  stopPrice: number;
  price?: number;
  leverage: number;
  reduceOnly?: boolean;
  closeOrder?: boolean;
  marginMode?: "ISOLATED" | "CROSS";
}) {
  const clientOid = `mcp_stop_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return kucoinRequest("POST", "/api/v1/orders", { ...params, clientOid });
}

export async function getOpenOrders(symbol?: string) {
  return kucoinRequest("GET", "/api/v1/openOrderStatistics", symbol ? { symbol } : undefined);
}

export async function getFills(params?: {
  symbol?: string;
  orderId?: string;
  side?: "buy" | "sell";
  type?: "limit" | "market";
}) {
  return kucoinRequest("GET", "/api/v1/fills", params as Record<string, unknown>);
}

// ─── Position Management ───────────────────────────────────

export async function getPositions() {
  return kucoinRequest("GET", "/api/v1/positions");
}

export async function getPosition(symbol: string) {
  return kucoinRequest("GET", "/api/v1/position", { symbol });
}

export async function modifyMargin(symbol: string, margin: number, bizNo?: string) {
  return kucoinRequest("POST", "/api/v1/position/margin/deposit-margin", {
    symbol,
    margin,
    bizNo: bizNo || `mcp_margin_${Date.now()}`,
  });
}

export async function getPositionsHistory(params?: { symbol?: string }) {
  return kucoinRequest("GET", "/api/v1/history-positions", params as Record<string, unknown>);
}

// ─── Funding & Account ─────────────────────────────────────

export async function getFundingRate(symbol: string) {
  return kucoinRequest("GET", `/api/v1/funding-rate/${symbol}/current`);
}

export async function getFundingHistory(symbol: string, from?: number, to?: number) {
  return kucoinRequest("GET", "/api/v1/contract/funding-rates", { symbol, from, to });
}

export async function getAccountFutures(currency?: string) {
  return kucoinRequest("GET", "/api/v1/account-overview", currency ? { currency } : undefined);
}
