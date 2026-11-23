import { DATA_VERSION } from "@/lib/server/guide-api";
export const runtime = "nodejs";
export function GET() { return Response.json({ status: "ok", application: "Al Bura Colour Studio", dataVersion: DATA_VERSION, photoProcessing: "browser-only", formulationsApproved: false }); }
