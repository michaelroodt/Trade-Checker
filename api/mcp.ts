/**
 * MCP Server endpoint — Vercel Edge Function
 * Handles JSON-RPC 2.0 requests for the Model Context Protocol.
 */

import { tools } from "../lib/tools.js";

export const config = { runtime: "edge" };

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: number | string;
  method: string;
  params?: Record<string, unknown>;
}

function jsonRpcResponse(id: number | string | null, result: unknown) {
  return Response.json({ jsonrpc: "2.0", id, result }, { status: 200, headers: corsHeaders() });
}

function jsonRpcError(id: number | string | null, code: number, message: string) {
  return Response.json(
    { jsonrpc: "2.0", id, error: { code, message } },
    { status: 200, headers: corsHeaders() }
  );
}

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-MCP-Auth-Key, Authorization",
  };
}

function authenticate(request: Request): boolean {
  const authKey = process.env.MCP_AUTH_KEY;
  if (!authKey) return true; // No auth configured = open (dev mode)

  const headerKey = request.headers.get("X-MCP-Auth-Key");
  const bearerToken = request.headers.get("Authorization")?.replace("Bearer ", "");
  return headerKey === authKey || bearerToken === authKey;
}

export default async function handler(request: Request): Promise<Response> {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  if (request.method !== "POST") {
    return jsonRpcError(null, -32600, "Only POST requests are supported");
  }

  // Authenticate
  if (!authenticate(request)) {
    return jsonRpcError(null, -32000, "Unauthorized: invalid or missing auth key");
  }

  let body: JsonRpcRequest;
  try {
    body = await request.json();
  } catch {
    return jsonRpcError(null, -32700, "Parse error: invalid JSON");
  }

  if (body.jsonrpc !== "2.0" || !body.method) {
    return jsonRpcError(body.id ?? null, -32600, "Invalid JSON-RPC 2.0 request");
  }

  const { method, params, id } = body;

  // ─── MCP Protocol Methods ─────────────────────────────

  // Initialize — return server capabilities
  if (method === "initialize") {
    return jsonRpcResponse(id, {
      protocolVersion: "2024-11-05",
      capabilities: { tools: { listChanged: false } },
      serverInfo: {
        name: "kucoin-futures-mcp",
        version: "1.0.0",
      },
    });
  }

  // List available tools
  if (method === "tools/list") {
    return jsonRpcResponse(id, {
      tools: tools.map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
      })),
    });
  }

  // Call a tool
  if (method === "tools/call") {
    const toolName = params?.name as string;
    const toolArgs = params?.arguments ?? {};
    const tool = tools.find((t) => t.name === toolName);

    if (!tool) {
      return jsonRpcError(id, -32601, `Tool not found: ${toolName}`);
    }

    try {
      const result = await tool.handler(toolArgs);
      return jsonRpcResponse(id, {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return jsonRpcResponse(id, {
        content: [{ type: "text", text: `Error: ${message}` }],
        isError: true,
      });
    }
  }

  // Ping
  if (method === "ping") {
    return jsonRpcResponse(id, {});
  }

  // Notifications (no response needed per spec, but we acknowledge)
  if (method === "notifications/initialized") {
    return jsonRpcResponse(id, {});
  }

  return jsonRpcError(id, -32601, `Method not found: ${method}`);
}
