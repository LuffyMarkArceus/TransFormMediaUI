// Client-side upload size limits. They mirror the backend's configured caps
// (MAX_UPLOAD_BYTES / MAX_IMAGE_BYTES) and the Cloud Run request limit:
// multipart requests through Google's frontend die at ~32 MB with an HTML
// 413, so anything routed multipart must stay under 30 MB. Larger files go
// through the presigned direct-to-R2 flow instead.
export const MULTIPART_MAX_BYTES = 30 * 1024 * 1024
export const MAX_IMAGE_BYTES = 32 * 1024 * 1024
export const MAX_UPLOAD_BYTES = 500 * 1024 * 1024

function mb(bytes: number): number {
  return Math.floor(bytes / (1024 * 1024))
}

/** Per-file cap for the presigned flow: images are dimension-processed
 * synchronously and stay small; video/audio may reach the 500 MB cap. */
export function maxBytesFor(contentType: string): number {
  return contentType.startsWith("image/") ? MAX_IMAGE_BYTES : MAX_UPLOAD_BYTES
}

export function formatCap(bytes: number): string {
  return `${mb(bytes)} MB`
}

/** Client-side rejection message, or null when the file is acceptable. */
export function precheckFile(file: File): string | null {
  if (file.size > maxBytesFor(file.type)) {
    return `${file.name} exceeds the ${formatCap(maxBytesFor(file.type))} limit for ${file.type.startsWith("image/") ? "images" : "this format"}.`
  }
  return null
}
