import type { Media } from "@/types/media"

/** Private R2 S3 endpoint URLs are not browser-loadable; prefer public CDN base URLs. */
export function isBrowserLoadableMediaUrl(url?: string | null): boolean {
  if (!url) return false
  return !url.includes("r2.cloudflarestorage.com")
}

/** Pick the first URL suitable for <img> / <video> in the dashboard grid. */
export function gridThumbnailUrl(item: Media): string {
  const candidates =
    item.type === "image"
      ? [item.processedURL, item.originalURL, item.thumbnailURL]
      : [item.thumbnailURL, item.processedURL, item.originalURL]

  return candidates.find(isBrowserLoadableMediaUrl) ?? ""
}

/** URL for the full viewer (modal). */
export function viewerMediaUrl(item: Media): string {
  const candidates =
    item.type === "image"
      ? [item.processedURL, item.originalURL, item.thumbnailURL]
      : [item.processedURL, item.originalURL, item.thumbnailURL]

  return candidates.find(isBrowserLoadableMediaUrl) ?? ""
}
