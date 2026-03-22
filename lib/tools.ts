/**
 * MCP Tool definitions with Zod validation schemas.
 * Each tool maps to a KuCoin Futures API operation.
 */

import { z } from "zod";
import * as kc from "./kucoin-client.js";

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  zodSchema: z.ZodType;
  handler: (args: unknown) => Promise<unknown>;
}

// ─── Helper: Zod schema → JSON Schema (simplified) ────────

function zodToJsonSchema(schema: z.ZodObject<z.ZodRawShape>): Record<string, unknown> {
  const shape = schema.shape;
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  for (const [key, value] of Object.entries(shape)) {
    const zodType = value as z.ZodTypeAny;
    const prop: Record<string, unknown> = {};

    // Unwrap optional
    let inner = zodType;
    let isOptional = false;
    if (inner instanceof z.ZodOptional) {
      isOptional = true;
      inner = inner.unwrap();
    }
    if (inner instanceof z.ZodDefault) {
      isOptional = true;
      inner = inner.removeDefault();
    }

    if (inner instanceof z.ZodString) prop.type = "string";
    else if (inner instanceof z.ZodNumber) prop.type = "number";
    else if (inner instanceof z.ZodBoolean) prop.type = "boolean";
    else if (inner instanceof z.ZodEnum) {
      prop.type = "string";
      prop.enum = inner._def.values;
    } else {
      prop.type = "string";
    }

    if (inner.description) prop.description = inner.description;
    properties[key] = prop;
    if (!isOptional) required.push(key);
  }

  return { type: "object", properties, required };
}

// ─── Tool Definitions ──────────────────────────────────────

const getSymbolsSchema = z.object({});
const getTickerSchema = z.object({
  symbol: z.string().describe("Futures contract symbol, e.g. XBTUSDTM"),
});
const getOrderBookSchema = z.object({
  symbol: z.string().describe("Futures contract symbol"),
});
const getKlinesSchema = z.object({
  symbol: z.string().describe("Futures contract symbol"),
  granularity: z.number().describe("Kline interval in minutes: 1,5,15,30,60,120,240,480,720,1440,10080"),
  from: z.number().optional().describe("Start time in ms (Unix timestamp)"),
  to: z.number().optional().describe("End time in ms (Unix timestamp)"),
});
const getSymbolDetailSchema = z.object({
  symbol: z.string().describe("Futures contract symbol"),
});
const addOrderSchema = z.object({
  symbol: z.string().describe("Futures contract symbol"),
  side: z.enum(["buy", "sell"]).describe("Order side"),
  type: z.enum(["limit", "market"]).describe("Order type"),
  size: z.number().describe("Order quantity (number of contracts)"),
  price: z.number().optional().describe("Limit price (required for limit orders)"),
  leverage: z.number().describe("Leverage multiplier (e.g. 5, 10, 20)"),
  reduceOnly: z.boolean().optional().describe("If true, only reduces position"),
  closeOrder: z.boolean().optional().describe("If true, closes entire position"),
  marginMode: z.enum(["ISOLATED", "CROSS"]).optional().describe("Margin mode"),
  timeInForce: z.enum(["GTC", "IOC"]).optional().describe("Time in force"),
});
const cancelOrderSchema = z.object({
  orderId: z.string().describe("Order ID to cancel"),
});
const cancelAllOrdersSchema = z.object({
  symbol: z.string().optional().describe("Cancel orders for this symbol only"),
});
const getOrdersSchema = z.object({
  symbol: z.string().optional().describe("Filter by symbol"),
  status: z.enum(["active", "done"]).optional().describe("Filter by status"),
  side: z.enum(["buy", "sell"]).optional().describe("Filter by side"),
});
const getOrderByIdSchema = z.object({
  orderId: z.string().describe("Order ID"),
});
const addStopOrderSchema = z.object({
  symbol: z.string().describe("Futures contract symbol"),
  side: z.enum(["buy", "sell"]).describe("Order side"),
  type: z.enum(["limit", "market"]).describe("Order type"),
  size: z.number().describe("Order quantity"),
  stop: z.enum(["down", "up"]).describe("Stop trigger direction"),
  stopPriceType: z.enum(["TP", "IP", "MP"]).describe("Stop price type: Trade/Index/Mark Price"),
  stopPrice: z.number().describe("Stop trigger price"),
  price: z.number().optional().describe("Limit price (for limit stop orders)"),
  leverage: z.number().describe("Leverage multiplier"),
  reduceOnly: z.boolean().optional().describe("If true, only reduces position"),
  marginMode: z.enum(["ISOLATED", "CROSS"]).optional().describe("Margin mode"),
});
const getOpenOrdersSchema = z.object({
  symbol: z.string().optional().describe("Filter by symbol"),
});
const getFillsSchema = z.object({
  symbol: z.string().optional().describe("Filter by symbol"),
  orderId: z.string().optional().describe("Filter by order ID"),
  side: z.enum(["buy", "sell"]).optional().describe("Filter by side"),
});
const getPositionsSchema = z.object({});
const getPositionSchema = z.object({
  symbol: z.string().describe("Futures contract symbol"),
});
const modifyMarginSchema = z.object({
  symbol: z.string().describe("Futures contract symbol"),
  margin: z.number().describe("Margin amount to add (positive) or remove (negative)"),
});
const getPositionsHistorySchema = z.object({
  symbol: z.string().optional().describe("Filter by symbol"),
});
const getFundingRateSchema = z.object({
  symbol: z.string().describe("Futures contract symbol"),
});
const getFundingHistorySchema = z.object({
  symbol: z.string().describe("Futures contract symbol"),
  from: z.number().optional().describe("Start time in ms"),
  to: z.number().optional().describe("End time in ms"),
});
const getAccountFuturesSchema = z.object({
  currency: z.string().optional().describe("Currency, e.g. USDT, XBT"),
});

export const tools: ToolDefinition[] = [
  {
    name: "getSymbols",
    description: "List all available KuCoin Futures contracts with their specs",
    inputSchema: zodToJsonSchema(getSymbolsSchema),
    zodSchema: getSymbolsSchema,
    handler: async () => kc.getSymbols(),
  },
  {
    name: "getTicker",
    description: "Get real-time ticker data (price, volume, 24h stats) for a futures symbol",
    inputSchema: zodToJsonSchema(getTickerSchema),
    zodSchema: getTickerSchema,
    handler: async (args) => {
      const { symbol } = getTickerSchema.parse(args);
      return kc.getTicker(symbol);
    },
  },
  {
    name: "getOrderBook",
    description: "Get order book depth (top 20 bids/asks) for a futures symbol",
    inputSchema: zodToJsonSchema(getOrderBookSchema),
    zodSchema: getOrderBookSchema,
    handler: async (args) => {
      const { symbol } = getOrderBookSchema.parse(args);
      return kc.getOrderBook(symbol);
    },
  },
  {
    name: "getKlines",
    description: "Get candlestick/OHLCV data for technical analysis. Granularity in minutes.",
    inputSchema: zodToJsonSchema(getKlinesSchema),
    zodSchema: getKlinesSchema,
    handler: async (args) => {
      const { symbol, granularity, from, to } = getKlinesSchema.parse(args);
      return kc.getKlines(symbol, granularity, from, to);
    },
  },
  {
    name: "getSymbolDetail",
    description: "Get contract specifications (tick size, lot size, max leverage, etc.)",
    inputSchema: zodToJsonSchema(getSymbolDetailSchema),
    zodSchema: getSymbolDetailSchema,
    handler: async (args) => {
      const { symbol } = getSymbolDetailSchema.parse(args);
      return kc.getSymbolDetail(symbol);
    },
  },
  {
    name: "addOrder",
    description: "Place a new futures order (limit or market). Specify leverage, margin mode, size.",
    inputSchema: zodToJsonSchema(addOrderSchema),
    zodSchema: addOrderSchema,
    handler: async (args) => {
      const params = addOrderSchema.parse(args);
      return kc.addOrder(params);
    },
  },
  {
    name: "cancelOrder",
    description: "Cancel a specific open order by its ID",
    inputSchema: zodToJsonSchema(cancelOrderSchema),
    zodSchema: cancelOrderSchema,
    handler: async (args) => {
      const { orderId } = cancelOrderSchema.parse(args);
      return kc.cancelOrder(orderId);
    },
  },
  {
    name: "cancelAllOrders",
    description: "Cancel all open orders, optionally filtered by symbol",
    inputSchema: zodToJsonSchema(cancelAllOrdersSchema),
    zodSchema: cancelAllOrdersSchema,
    handler: async (args) => {
      const { symbol } = cancelAllOrdersSchema.parse(args);
      return kc.cancelAllOrders(symbol);
    },
  },
  {
    name: "getOrders",
    description: "List orders with optional filters (symbol, status, side)",
    inputSchema: zodToJsonSchema(getOrdersSchema),
    zodSchema: getOrdersSchema,
    handler: async (args) => {
      const params = getOrdersSchema.parse(args);
      return kc.getOrders(params);
    },
  },
  {
    name: "getOrderById",
    description: "Get detailed information about a specific order",
    inputSchema: zodToJsonSchema(getOrderByIdSchema),
    zodSchema: getOrderByIdSchema,
    handler: async (args) => {
      const { orderId } = getOrderByIdSchema.parse(args);
      return kc.getOrderById(orderId);
    },
  },
  {
    name: "addStopOrder",
    description: "Place a stop-loss or take-profit order triggered by price conditions",
    inputSchema: zodToJsonSchema(addStopOrderSchema),
    zodSchema: addStopOrderSchema,
    handler: async (args) => {
      const params = addStopOrderSchema.parse(args);
      return kc.addStopOrder(params);
    },
  },
  {
    name: "getOpenOrders",
    description: "Get count of currently open orders, optionally by symbol",
    inputSchema: zodToJsonSchema(getOpenOrdersSchema),
    zodSchema: getOpenOrdersSchema,
    handler: async (args) => {
      const { symbol } = getOpenOrdersSchema.parse(args);
      return kc.getOpenOrders(symbol);
    },
  },
  {
    name: "getFills",
    description: "Get executed trade fills with fee and liquidity information",
    inputSchema: zodToJsonSchema(getFillsSchema),
    zodSchema: getFillsSchema,
    handler: async (args) => {
      const params = getFillsSchema.parse(args);
      return kc.getFills(params);
    },
  },
  {
    name: "getPositions",
    description: "Get all currently open futures positions",
    inputSchema: zodToJsonSchema(getPositionsSchema),
    zodSchema: getPositionsSchema,
    handler: async () => kc.getPositions(),
  },
  {
    name: "getPosition",
    description: "Get position details for a specific symbol (P&L, margin, liquidation price)",
    inputSchema: zodToJsonSchema(getPositionSchema),
    zodSchema: getPositionSchema,
    handler: async (args) => {
      const { symbol } = getPositionSchema.parse(args);
      return kc.getPosition(symbol);
    },
  },
  {
    name: "modifyMargin",
    description: "Add or remove margin from an open position",
    inputSchema: zodToJsonSchema(modifyMarginSchema),
    zodSchema: modifyMarginSchema,
    handler: async (args) => {
      const { symbol, margin } = modifyMarginSchema.parse(args);
      return kc.modifyMargin(symbol, margin);
    },
  },
  {
    name: "getPositionsHistory",
    description: "Get historical closed positions with P&L analysis",
    inputSchema: zodToJsonSchema(getPositionsHistorySchema),
    zodSchema: getPositionsHistorySchema,
    handler: async (args) => {
      const { symbol } = getPositionsHistorySchema.parse(args);
      return kc.getPositionsHistory(symbol ? { symbol } : undefined);
    },
  },
  {
    name: "getFundingRate",
    description: "Get current funding rate for a futures symbol",
    inputSchema: zodToJsonSchema(getFundingRateSchema),
    zodSchema: getFundingRateSchema,
    handler: async (args) => {
      const { symbol } = getFundingRateSchema.parse(args);
      return kc.getFundingRate(symbol);
    },
  },
  {
    name: "getFundingHistory",
    description: "Get historical funding rate data",
    inputSchema: zodToJsonSchema(getFundingHistorySchema),
    zodSchema: getFundingHistorySchema,
    handler: async (args) => {
      const { symbol, from, to } = getFundingHistorySchema.parse(args);
      return kc.getFundingHistory(symbol, from, to);
    },
  },
  {
    name: "getAccountFutures",
    description: "Get futures account overview (balance, available margin, unrealized P&L)",
    inputSchema: zodToJsonSchema(getAccountFuturesSchema),
    zodSchema: getAccountFuturesSchema,
    handler: async (args) => {
      const { currency } = getAccountFuturesSchema.parse(args);
      return kc.getAccountFutures(currency);
    },
  },
];
