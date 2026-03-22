export const config = { runtime: "edge" };

export default async function handler(): Promise<Response> {
  return Response.json({
    status: "ok",
    server: "kucoin-futures-mcp",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
}
