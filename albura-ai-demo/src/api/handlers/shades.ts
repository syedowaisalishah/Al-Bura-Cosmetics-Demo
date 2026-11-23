import { demoShades } from "@/shared/data/shades";
import { DATA_VERSION } from "@/shared/data/version";
export function getShadesResponse() { return Response.json({ shades: demoShades, dataVersion: DATA_VERSION, status: "illustrative" }, { headers: { "Cache-Control": "public, max-age=60" } }); }
