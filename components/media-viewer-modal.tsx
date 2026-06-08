"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, ImageIcon, Film, Music, FileText, Calendar, Maximize, Copy, ExternalLink, Check, Loader2, ChevronLeft, ChevronRight, Share2, ZoomIn, ZoomOut, RotateCcw } from "lucide-react"

import type { Media } from "@/types/media"
import { formatBytes, formatDate, formatDuration } from "@/lib/helpers"
import { viewerMediaUrl } from "@/lib/media-url"
import ShareDialog from "@/components/share-dialog"
import axios from "axios"

type MediaViewerModalProps = {
  media: Media | null
  open: boolean
  onClose: () => void
  onNext?: () => void
  onPrev?: () => void
}

export default function MediaViewerModal({
  media,
  open,
  onClose,
  onNext,
  onPrev,
}: MediaViewerModalProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const imgRef = useRef<HTMLImageElement>(null)

  const resetView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (media?.type !== "image") return
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setZoom((z) => Math.max(0.25, Math.min(10, z + delta)))
  }, [media?.type])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (media?.type !== "image" || zoom <= 1) return
    e.preventDefault()
    setIsPanning(true)
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }, [media?.type, zoom, pan])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return
    setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y })
  }, [isPanning, panStart])

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
  }, [])

  useEffect(() => {
    resetView()
  }, [media?.id])

  useEffect(() => {
    setLoading(true)
    setError(false)
  }, [media?.id])

  useEffect(() => {
    if (!open) return
    const original = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = original
    }
  }, [open])

  const viewerSrc = media ? viewerMediaUrl(media) : ""

  const handleDownload = useCallback(async () => {
    if (!media) return
    setDownloading(true)
    try {
      const response = await axios.get(media.originalURL, {
        responseType: "blob",
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", media.name)
      document.body.appendChild(link)
      link.click()

      link.parentNode?.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Download failed", err)
      window.open(media.originalURL, "_blank")
    } finally {
      setDownloading(false)
    }
  }, [media])

  const handleCopy = useCallback(() => {
    if (!media) return
    navigator.clipboard.writeText(media.processedURL ?? media.originalURL)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [media])

  useEffect(() => {
    if (!open || !media) return

    function onKeyDown(e: KeyboardEvent) {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return

      switch (e.key.toLowerCase()) {
        case "arrowleft":
          e.preventDefault()
          onPrev?.()
          break
        case "arrowright":
          e.preventDefault()
          onNext?.()
          break
        case "d":
          e.preventDefault()
          handleDownload()
          break
        case "c":
          e.preventDefault()
          handleCopy()
          break
        case "o":
          window.open(media?.originalURL, "_blank")
          break
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open, media, onNext, onPrev, handleDownload, handleCopy])

  if (!media) return null

  const getTypeIcon = () => {
    switch (media.type) {
      case "video":
        return <Film className="w-4 h-4" />
      case "audio":
        return <Music className="w-4 h-4" />
      default:
        return <ImageIcon className="w-4 h-4" />
    }
  }

  const renderMediaPreview = () => {
    if (!viewerSrc) {
      return (
        <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
          <FileText className="w-10 h-10 opacity-20" />
          <p className="text-sm">No preview URL available.</p>
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
          <FileText className="w-10 h-10 opacity-20" />
          <p className="text-sm">Failed to load preview.</p>
        </div>
      )
    }

    const loadingOverlay = loading ? (
      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white" />
      </div>
    ) : null

    switch (media.type) {
      case "video":
        return (
          <div className="relative flex h-full w-full items-center justify-center">
            <video
              src={viewerSrc}
              controls
              className="max-h-full max-w-full"
              onLoadedData={() => setLoading(false)}
              onError={() => { setError(true); setLoading(false) }}
            />
            {loadingOverlay}
          </div>
        )
      case "audio":
        return (
          <div className="relative flex flex-col items-center justify-center gap-4 p-8">
            <Music className="w-16 h-16 text-muted-foreground" />
            <audio
              src={viewerSrc}
              controls
              className="w-full max-w-md"
              onLoadedData={() => setLoading(false)}
              onError={() => { setError(true); setLoading(false) }}
            />
            {loadingOverlay}
          </div>
        )
      default:
        return (
          <div
            className="relative flex h-full w-full items-center justify-center overflow-hidden"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: zoom > 1 ? (isPanning ? "grabbing" : "grab") : "default" }}
          >
            <img
              ref={imgRef}
              src={viewerSrc}
              alt={media.name}
              onLoad={() => setLoading(false)}
              onError={() => { setError(true); setLoading(false) }}
              className="max-h-full max-w-full transition-opacity duration-300"
              style={{
                opacity: loading ? 0 : 1,
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: "center",
              }}
              draggable={false}
            />
            {loadingOverlay}
          </div>
        )
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-none w-[90vw] h-[90vh] bg-background p-0 overflow-hidden gap-0 flex flex-col border-none"
        aria-describedby="media-modal-dialog"
      >
        <DialogHeader className="px-5 py-3 border-b bg-background flex-shrink-0">
          <DialogTitle className="text-sm font-semibold truncate flex items-center gap-2">
            {getTypeIcon()}
            {media.name}
            <span className="text-zinc-300 truncate semi-bold">({media.type})</span>
          </DialogTitle>
        </DialogHeader>

        <div className="relative flex flex-grow flex-shrink items-center justify-center bg-zinc-950 overflow-hidden">
          {renderMediaPreview()}

          {onPrev && (
            <button
              onClick={onPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
          )}
          {onNext && (
            <button
              onClick={onNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          )}
        </div>

        <div className="bg-muted/30 border-t p-4 sm:px-10 flex-shrink-0">
          {media.type === "image" && (
            <div className="flex items-center gap-2 mb-3">
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2"
                onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}
                title="Zoom out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </Button>
              <span className="text-xs font-mono min-w-[3rem] text-center">{Math.round(zoom * 100)}%</span>
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2"
                onClick={() => setZoom((z) => Math.min(10, z + 0.25))}
                title="Zoom in"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-2"
                onClick={resetView}
                title="Reset zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 flex-grow">
              {media.width && media.height && (
                <MetadataItem
                  icon={<Maximize className="w-4 h-4" />}
                  label="Resolution"
                  value={`${media.width} × ${media.height}`}
                />
              )}
              {media.duration && (
                <MetadataItem
                  icon={<Calendar className="w-4 h-4" />}
                  label="Duration"
                  value={formatDuration(media.duration)}
                />
              )}
              <MetadataItem
                icon={<FileText className="w-4 h-4" />}
                label="Size"
                value={formatBytes(media.sizeBytes)}
              />
              <MetadataItem
                icon={getTypeIcon()}
                label="Format"
                value={media.format.split("/")[1]?.toUpperCase() || media.format}
              />
              <MetadataItem
                icon={<Calendar className="w-4 h-4" />}
                label="Uploaded"
                value={formatDate(media.createdAt)}
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                disabled={downloading}
                className="h-9 px-5 font-medium"
                onClick={handleDownload}
              >
                {downloading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Raw
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="h-9 px-3"
                title="Open Original"
                onClick={() => window.open(media.originalURL, "_blank")}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="h-9 px-5 font-medium"
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4 text-green-500" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    URL
                  </>
                )}
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="h-9 px-5 font-medium"
                onClick={() => setShareOpen(true)}
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>

      <ShareDialog
        mediaId={media.id}
        mediaName={media.name}
        open={shareOpen}
        onClose={() => setShareOpen(false)}
      />
    </Dialog>
  )
}

function MetadataItem({
  value,
  icon,
}: {
  value: string
  icon?: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <span className="text-xs">{value}</span>
    </div>
  )
}
