import { canvasBlob, MAX_PROCESSING_DIMENSION } from "@/web/ai/photo-utils";

export function cameraErrorMessage(error: unknown) {
  const name = error instanceof Error ? error.name : "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError") return "Camera permission was denied. Allow camera access in your browser and try again, or use Upload Photo.";
  if (name === "NotFoundError" || name === "DevicesNotFoundError") return "No camera is available. Connect a webcam or use Upload Photo.";
  if (name === "NotReadableError" || name === "TrackStartError") return "The camera could not be opened. It may be in use by another app. Close that app and try again.";
  if (name === "OverconstrainedError") return "This camera does not support the requested settings. Try another camera or use Upload Photo.";
  if (name === "SecurityError") return "Camera access is blocked by this browser or page. Use localhost or HTTPS and allow camera permission.";
  return error instanceof Error ? error.message : "The camera could not start. Please try again or use Upload Photo.";
}

export function stopCameraTracks(stream: MediaStream | null) {
  for (const track of stream?.getTracks() ?? []) track.stop();
}

/** Freeze pixels synchronously before PNG encoding; the caller may now stop the stream. */
export async function captureVideoPhoto(video: HTMLVideoElement, mirrored: boolean): Promise<File> {
  if (video.readyState < 2 || !video.videoWidth || !video.videoHeight) throw new Error("The camera is not ready yet. Wait for the preview and try again.");
  const scale = Math.min(1, MAX_PROCESSING_DIMENSION / Math.max(video.videoWidth, video.videoHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
  canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D is unavailable. Use Upload Photo in another browser.");
  if (mirrored) { context.translate(canvas.width, 0); context.scale(-1, 1); }
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  return new File([await canvasBlob(canvas)], "albura-camera.png", { type: "image/png" });
}
