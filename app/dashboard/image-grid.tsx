"use client"

import { ImageMedia } from "./page"

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

interface ImageGridProps {
  images: ImageMedia[]
  loading: boolean
  error: string | null
}

export default function ImageGrid({ images, loading, error }: ImageGridProps) {
  if (loading) {
    return <div className="text-muted-foreground">Loading images...</div>
  }

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  if (images && images.length === 0) {
    return (
      <div className="text-muted-foreground text-center py-12">
        No images uploaded yet.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {images && images.map((img) => (
        <div
          key={img.id}
          className="group relative overflow-hidden rounded-xl border bg-background shadow-sm transition hover:shadow-md"
        >
          {/* Image */}
          <div className="aspect-square overflow-hidden bg-muted">
            <img
              src={img.originalURL}
              alt={img.name ?? "uploaded image"}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          </div>

          {/* Metadata */}
          <div className="space-y-1 p-3">
            <p className="truncate text-sm font-medium">
              {img.name ?? "Untitled image"}
            </p>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatBytes(img.sizeBytes)}</span>
              <span>{formatDate(img.createdAt)}</span>
            </div>
          </div>

          {/* Hover actions */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
            <div className="pointer-events-auto flex gap-2">
              <button
                onClick={() => window.open(img.originalURL, "_blank")}
                className="rounded-md bg-white/90 px-3 py-1 text-xs font-medium text-black hover:bg-white"
              >
                View
              </button>
              <button
                onClick={() => navigator.clipboard.writeText(img.originalURL)}
                className="rounded-md bg-white/90 px-3 py-1 text-xs font-medium text-black hover:bg-white"
              >
                Copy URL
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
