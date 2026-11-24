import { DATA_VERSION } from "@/shared/data/version";

export function getHealthResponse() {
  return Response.json({
    status: "ok",
    application: "Al Bura Colour Studio",
    dataVersion: DATA_VERSION,
    photoProcessing: "browser-only",
    formulationsApproved: false,
  });
}
