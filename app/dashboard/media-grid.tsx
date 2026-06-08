"use client"

import axios from "axios"
import type { Media } from "@/types/media"
import { useAuth } from "@clerk/nextjs"
import { useState, useEffect, useCallback } from "react"
import { ImageIcon, Film, Music, Play, Trash2, CheckSquare, Square, X, RotateCcw, RefreshCw } from "lucide-react"

import RenameMediaModal from "@/components/rename-media-modal"
import MediaViewerModal from "@/components/media-viewer-modal"
import ShareDialog from "@/components/share-dialog"

import { formatBytes, formatDate } from "@/lib/helpers"
import { gridThumbnailUrl } from "@/lib/media-url"
import Link from "next/link"
import { authHeaders, mediaPath } from "@/lib/api"
import { toast } from "sonner"

interface MediaGridProps {
  mediaItems: Media[]
  setMediaItems: React.Dispatch<React.SetStateAction<Media[]>>
  onReload: () => void
  isTrash?: boolean
}

export default function MediaGrid({ mediaItems, setMediaItems, onReload, isTrash }: MediaGridProps) {
  const [renameTarget, setRenameTarget] = useState<Media | null>(null)
  const [saving, setSaving] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)
  const [shareTarget, setShareTarget] = useState<Media | null>(null)

  const [viewerOpen, setViewerOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)
  const selectedMedia = currentIndex !== null && currentIndex < mediaItems.length ? mediaItems[currentIndex] : null

  const { getToken } = useAuth()

  // Poll for status changes on items with status="uploaded"
  useEffect(() => {
    const uploading = mediaItems.filter(m => m.status === "uploaded")
    if (uploading.length === 0) return

    const poll = async () => {
      try {
        const headers = await authHeaders(getToken)

        for (const item of uploading) {
          const res = await axios.get<Media>(mediaPath(`/${item.id}/info`), { headers })
          if (res.data.status !== "uploaded") {
            setMediaItems(prev => prev.map(m => m.id === item.id ? res.data : m))
          }
        }
      } catch {
        // Network errors during polling are harmless
      }
    }

    const interval = setInterval(poll, 3000)
    poll()

    return () => clearInterval(interval)
  }, [mediaItems, getToken, setMediaItems])

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === mediaItems.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(mediaItems.map((m) => m.id)))
    }
  }

  async function restoreMedia(id: string) {
    try {
      const headers = await authHeaders(getToken)
      await axios.patch(mediaPath(`/${id}/restore`), {}, { headers })
      setMediaItems((prev) => prev.filter((m) => m.id !== id))
      toast.success("Item restored")
      onReload()
    } catch {
      toast.error("Failed to restore media.")
    }
  }

  async function permanentDelete(id: string) {
    const previous = mediaItems
    setMediaItems((prev) => prev.filter((m) => m.id !== id))
    try {
      const headers = await authHeaders(getToken)
      await axios.delete(mediaPath(`/${id}/permanent`), { headers })
      toast.success("Item permanently deleted")
      onReload()
    } catch {
      setMediaItems(previous)
      toast.error("Failed to permanently delete media.")
    }
  }

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

  async function reprocessMedia(id: string) {
    setMediaItems((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: "uploaded" } : m))
    )
    try {
      const headers = await authHeaders(getToken)
      await axios.post(mediaPath(`/${id}/reprocess`), {}, { headers })
      toast.success("Reprocessing started")
    } catch {
      setMediaItems((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: "failed" } : m))
      )
      toast.error("Failed to start reprocessing")
    }
  }

  async function batchDelete() {
    const ids = Array.from(selected)
    if (ids.length === 0) return

    setDeleting(true)
    const previous = mediaItems
    setMediaItems((prev) => prev.filter((m) => !ids.includes(m.id)))

    try {
      const headers = await authHeaders(getToken)
      if (isTrash) {
        await Promise.all(ids.map((id) => axios.delete(mediaPath(`/${id}/permanent`), { headers })))
      } else {
        await axios.post(mediaPath("/batch-delete"), { ids }, { headers })
      }
      setSelected(new Set())
      toast.success(`${ids.length} items deleted`)
      onReload()
    } catch {
      setMediaItems(previous)
      toast.error("Failed to delete some items. Please try again.")
    } finally {
      setDeleting(false)
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
    <>
      {selected.size > 0 && (
        <div className="sticky top-0 z-10 -mx-6 px-6 py-3 mb-4 flex items-center gap-3 rounded-lg border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <button onClick={toggleSelectAll} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
          <span className="text-sm font-medium">{selected.size} selected</span>
          <button
            onClick={batchDelete}
            disabled={deleting}
            className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {deleting ? "Deleting..." : `Delete (${selected.size})`}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {mediaItems.map((item) => (
          <div
            key={item.id}
            className={`group relative overflow-hidden rounded-xl border bg-background shadow-sm transition hover:shadow-md ${
              selected.has(item.id) ? "ring-2 ring-primary" : ""
            }`}
          >
            <div
              className="absolute top-2 left-2 z-10 cursor-pointer"
              onClick={(e) => { e.stopPropagation(); toggleSelect(item.id) }}
            >
              {selected.has(item.id) ? (
                <CheckSquare className="h-5 w-5 text-primary" />
              ) : (
                <Square className="h-5 w-5 text-white/80 hover:text-white" />
              )}
            </div>

            <div className="aspect-square overflow-hidden bg-muted">
              {getThumbnailContent(item)}
            </div>

            <div className="space-y-1 p-3">
              <p className="truncate text-sm font-medium">{item.name}</p>
              <div className="flex items-center gap-2">
                {item.status === "uploaded" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-yellow-500" />
                    Processing
                  </span>
                )}
                {item.status === "failed" && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
                    Failed
                  </span>
                )}
              </div>
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
                {isTrash ? (
                  <>
                    <button
                      onClick={() => restoreMedia(item.id)}
                      className="inline-flex items-center gap-1 rounded-md bg-green-500 px-3 py-1 text-xs font-medium text-white hover:bg-green-600"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Restore
                    </button>
                    <button
                      onClick={() => permanentDelete(item.id)}
                      className="inline-flex items-center gap-1 rounded-md bg-red-500 px-3 py-1 text-xs font-medium text-white hover:bg-red-600"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete Forever
                    </button>
                  </>
                ) : (
                  <>
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
                      onClick={() => setShareTarget(item)}
                      className="rounded-md bg-white/90 px-3 py-1 text-xs font-medium text-black hover:bg-white"
                    >
                      Share
                    </button>
                    <button
                      onClick={() => deleteMedia(item.id)}
                      className="rounded-md bg-red-500 px-3 py-1 text-xs font-medium text-white hover:bg-red-600"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => {
                        const input = document.createElement('input')
                        input.type = 'file'
                        input.accept = ['image/jpeg','image/png','video/mp4','audio/mpeg','audio/wav','audio/ogg','audio/flac','audio/aac'].join(',')
                        input.onchange = async (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0]
                          if (!file) return
                          const formData = new FormData()
                          formData.append('file', file)
                          try {
                            const headers = await authHeaders(getToken)
                            await axios.put(mediaPath(`/${item.id}`), formData, { headers })
                            toast.success('Media replaced successfully')
                            onReload()
                          } catch {
                            toast.error('Failed to replace media')
                          }
                        }
                        input.click()
                      }}
                      className="rounded-md bg-white/90 px-3 py-1 text-xs font-medium text-black hover:bg-white"
                    >
                      Replace
                    </button>
                    {item.status === "failed" && (
                      <button
                        onClick={() => reprocessMedia(item.id)}
                        className="inline-flex items-center gap-1 rounded-md bg-yellow-500 px-3 py-1 text-xs font-medium text-white hover:bg-yellow-600"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Reprocess
                      </button>
                    )}
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
                  </>
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

        {shareTarget && (
          <ShareDialog
            mediaId={shareTarget.id}
            mediaName={shareTarget.name}
            open={!!shareTarget}
            onClose={() => setShareTarget(null)}
          />
        )}
      </div>
    </>
  )
}
