import { calculateGuide } from "@/api/services/guide-service";
export async function postGuideResponse(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json")) return Response.json({ error: "Send a JSON hair profile." }, { status: 415 });
  const text = await request.text();
  if (text.length > 8192) return Response.json({ error: "The profile is too large." }, { status: 413 });
  let input: unknown;
  try { input = JSON.parse(text); } catch { return Response.json({ error: "The profile contains invalid JSON." }, { status: 400 }); }
  const result = calculateGuide(input);
  return Response.json(result.body, { status: result.status, headers: { "Cache-Control": "no-store" } });
}
