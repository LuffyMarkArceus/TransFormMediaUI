export type MediaType = "image" | "video" | "audio"

export interface BaseMedia {
  id: string
  userID: string
  name: string
  type: MediaType

  originalURL: string
  processedURL?: string
  thumbnailURL?: string

  format: string
  sizeBytes: number

  width?: number
  height?: number
  duration?: number

  status: string
  createdAt: string
}

export type ImageMedia = BaseMedia
export type VideoMedia = BaseMedia
export type AudioMedia = BaseMedia
export type Media = BaseMedia

// Must stay aligned with Go upload handler (sniffed MIME, not browser-reported type).
export const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"]
export const SUPPORTED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm", "video/x-matroska"]
export const SUPPORTED_AUDIO_TYPES = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/ogg", "audio/flac", "audio/aac", "audio/mp4"]

export const ALL_SUPPORTED_TYPES = [
  ...SUPPORTED_IMAGE_TYPES,
  ...SUPPORTED_VIDEO_TYPES,
  ...SUPPORTED_AUDIO_TYPES,
]

export function isImageType(mimeType: string): boolean {
  return SUPPORTED_IMAGE_TYPES.includes(mimeType)
}

export function isVideoType(mimeType: string): boolean {
  return SUPPORTED_VIDEO_TYPES.includes(mimeType)
}

export function isAudioType(mimeType: string): boolean {
  return SUPPORTED_AUDIO_TYPES.includes(mimeType)
}

export function getMediaType(mimeType: string): MediaType | null {
  if (isImageType(mimeType)) return "image"
  if (isVideoType(mimeType)) return "video"
  if (isAudioType(mimeType)) return "audio"
  return null
}
