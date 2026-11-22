export const MAX_PHOTO_BYTES = 15 * 1024 * 1024;
export const MAX_PROCESSING_DIMENSION = 1024;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
export interface PreparedPhoto { pixels: ImageData; previewUrl: string; canvas: HTMLCanvasElement; fileName: string }

export function validatePhoto(file: File) {
  if (!allowedTypes.has(file.type) || !/\.(jpe?g|png|webp)$/i.test(file.name)) throw new Error("Choose a JPG, JPEG, PNG, or WebP photo.");
  if (file.size === 0 || file.size > MAX_PHOTO_BYTES) throw new Error("Choose a photo smaller than 15 MB that is not empty.");
}
export function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Could not create the preview image.")), "image/png"));
}
export async function pixelsToUrl(pixels: ImageData): Promise<string> {
  const canvas = document.createElement("canvas"); canvas.width = pixels.width; canvas.height = pixels.height;
  const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("Canvas 2D is unavailable in this browser.");
  ctx.putImageData(pixels, 0, 0);
  return URL.createObjectURL(await canvasBlob(canvas));
}
async function decodePhoto(file: File): Promise<{ image: CanvasImageSource; width: number; height: number; close: () => void }> {
  if (typeof createImageBitmap === "function") {
    try {
      const image = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { image, width: image.width, height: image.height, close: () => image.close() };
    } catch { /* HTMLImageElement provides the orientation-aware fallback. */ }
  }
  const url = URL.createObjectURL(file), image = new Image();
  image.src = url;
  try { await image.decode(); } catch { URL.revokeObjectURL(url); throw new Error("This photo could not be decoded. Try another JPG, PNG, or WebP image."); }
  return { image, width: image.naturalWidth, height: image.naturalHeight, close: () => URL.revokeObjectURL(url) };
}
export async function preparePhoto(file: File): Promise<PreparedPhoto> {
  validatePhoto(file);
  const decoded = await decodePhoto(file);
  try {
    if (!decoded.width || !decoded.height || decoded.width * decoded.height > 50_000_000) throw new Error("Choose a photo with valid dimensions below 50 megapixels.");
    const scale = Math.min(1, MAX_PROCESSING_DIMENSION / Math.max(decoded.width, decoded.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(decoded.width * scale)); canvas.height = Math.max(1, Math.round(decoded.height * scale));
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Canvas 2D is unavailable in this browser.");
    context.imageSmoothingEnabled = true; context.imageSmoothingQuality = "high";
    context.drawImage(decoded.image, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    const previewUrl = URL.createObjectURL(await canvasBlob(canvas));
    return { canvas, pixels, previewUrl, fileName: file.name };
  } finally { decoded.close(); }
}
