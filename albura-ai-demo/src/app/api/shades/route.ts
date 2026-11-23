import { demoShades } from "@/data/shades";
import { DATA_VERSION } from "@/lib/server/guide-api";
export const runtime = "nodejs";
export function GET() { return Response.json({ shades: demoShades, dataVersion: DATA_VERSION, status: "illustrative" }, { headers: { "Cache-Control": "public, max-age=60" } }); }
