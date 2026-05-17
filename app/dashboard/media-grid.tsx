"use client"

import axios from "axios"
import type { Media } from "@/types/media"
import { useAuth } from "@clerk/nextjs"
import { useState } from "react"
import { ImageIcon, Film, Music, Play } from "lucide-react"

import RenameMediaModal from "@/components/rename-media-modal"
import MediaViewerModal from "@/components/media-viewer-modal"

import { formatBytes, formatDate } from "@/lib/helpers"
import { gridThumbnailUrl } from "@/lib/media-url"
import Link from "next/link"
import { authHeaders, mediaPath } from "@/lib/api"
import { toast } from "sonner"

interface MediaGridProps {
  mediaItems: Media[]
  setMediaItems: React.Dispatch<React.SetStateAction<Media[]>>
  onReload: () => void
}

export default function MediaGrid({ mediaItems, setMediaItems, onReload }: MediaGridProps) {
  const [renameTarget, setRenameTarget] = useState<Media | null>(null)
  const [saving, setSaving] = useState(false)

  const [viewerOpen, setViewerOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)
  const selectedMedia = currentIndex !== null && currentIndex < mediaItems.length ? mediaItems[currentIndex] : null

  const { getToken } = useAuth()

  async function deleteMedia(id: string) {
    const previous = mediaItems
    setMediaItems((prev) => prev.filter((m) => m.id !== id))

    try {
      const headers = await authHeaders(getToken)
      await axios.delete(mediaPath(`/${id}`), { headers })
      onReload()
    } catch {
      setMediaItems(previous)
      toast.error("Failed to delete media. Please try again.")
    }
  }

  async function handleRename(newName: string) {
    if (!renameTarget) return

    setSaving(true)
    const previous = mediaItems
    const targetId = renameTarget.id

    setMediaItems((prev) =>
      prev.map((m) =>
        m.id === targetId ? { ...m, name: newName } : m
      )
    )

    try {
      const headers = await authHeaders(getToken)
      await axios.patch(
        mediaPath(`/${targetId}/rename`),
        { name: newName },
        { headers }
      )
      setRenameTarget(null)
      onReload()
    } catch {
      setMediaItems(previous)
      toast.error("Failed to rename media. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleNext = () => {
    setCurrentIndex((i) => {
      if (i === null) return null
      return Math.min((i + 1), mediaItems.length - 1)
    })
  }
  const handlePrev = () => {
    setCurrentIndex((i) => {
      if (i === null) return null
      return Math.max((i - 1), 0)
    })
  }

  const getMediaIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Film className="w-8 h-8" />
      case "audio":
        return <Music className="w-8 h-8" />
      default:
        return <ImageIcon className="w-8 h-8" />
    }
  }

  const getThumbnailContent = (item: Media) => {
    const thumbSrc = gridThumbnailUrl(item)

    if (item.type === "image") {
      if (!thumbSrc) {
        return (
          <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
            {getMediaIcon(item.type)}
          </div>
        )
      }
      return (
        <img
          src={thumbSrc}
          alt={item.name ?? "media"}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      )
    }

    return (
      <div className="h-full w-full flex items-center justify-center bg-muted relative">
        {thumbSrc ? (
          <img
            src={thumbSrc}
            alt={item.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="text-muted-foreground">
            {getMediaIcon(item.type)}
          </div>
        )}
        {item.type === "video" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
            <Play className="w-12 h-12 text-white fill-white" />
          </div>
        )}
      </div>
    )
  }

  if (mediaItems.length === 0) {
    return (
      <div className="text-muted-foreground text-center py-12">
        No media uploaded yet.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {mediaItems.map((item) => (
        <div
          key={item.id}
          className="group relative overflow-hidden rounded-xl border bg-background shadow-sm transition hover:shadow-md"
        >
          <div className="aspect-square overflow-hidden bg-muted">
            {getThumbnailContent(item)}
          </div>

          <div className="space-y-1 p-3">
            <p className="truncate text-sm font-medium">{item.name}</p>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                {getMediaIcon(item.type)}
                {formatBytes(item.sizeBytes)}
              </span>
              <span>{formatDate(item.createdAt)}</span>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
            <div className="pointer-events-auto flex gap-2 flex-wrap justify-center max-w-[90%]">
              <button
                onClick={() => {
                  setCurrentIndex(mediaItems.findIndex((i) => i.id === item.id))
                  setViewerOpen(true)
                }}
                className="rounded-md bg-white/90 px-3 py-1 text-xs font-medium text-black hover:bg-white"
              >
                View
              </button>
              <button
                onClick={() => navigator.clipboard.writeText(item.originalURL)}
                className="rounded-md bg-white/90 px-3 py-1 text-xs font-medium text-black hover:bg-white"
              >
                Copy URL
              </button>
              <button
                onClick={() => deleteMedia(item.id)}
                className="rounded-md bg-red-500 px-3 py-1 text-xs font-medium text-white hover:bg-red-600"
              >
                Delete
              </button>
              <button
                onClick={() => setRenameTarget(item)}
                className="rounded-md bg-white/90 px-3 py-1 text-xs font-medium text-black hover:bg-white"
              >
                Rename
              </button>
              {item.type === "image" && (
                <Link
                  href={`/images/${item.id}`}
                  className="rounded-md bg-white/90 px-3 py-1 text-xs font-medium text-black hover:bg-white"
                >
                  Edit
                </Link>
              )}
            </div>
          </div>
        </div>
      ))}

      {renameTarget && (
        <RenameMediaModal
          open
          initialName={renameTarget.name}
          loading={saving}
          onClose={() => setRenameTarget(null)}
          onSave={handleRename}
        />
      )}
      <MediaViewerModal
        media={selectedMedia}
        open={viewerOpen}
        onClose={() => {
          setViewerOpen(false)
          setCurrentIndex(null)
        }}
        onNext={currentIndex !== null && currentIndex < mediaItems.length - 1 ? handleNext : undefined}
        onPrev={currentIndex !== null && currentIndex > 0 ? handlePrev : undefined}
      />
    </div>
  )
}
