import { getHealthResponse } from "@/api/handlers/health";

export const runtime = "nodejs";

export function GET() {
  return getHealthResponse();
}
