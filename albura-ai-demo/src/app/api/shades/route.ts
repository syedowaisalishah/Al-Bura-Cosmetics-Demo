import { getShadesResponse } from "@/api/handlers/shades";

export const runtime = "nodejs";

export function GET() {
  return getShadesResponse();
}
