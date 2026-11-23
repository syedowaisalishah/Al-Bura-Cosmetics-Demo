import { postGuideResponse } from "@/api/handlers/guide";

export const runtime = "nodejs";

export function POST(request: Request) {
  return postGuideResponse(request);
}
