"use client"

import axios from "axios"
import type { ImageMedia } from "@/types/media"
import { useAuth } from "@clerk/nextjs"
import { useState } from "react"

import RenameImageModal from "@/components/rename-image-modal"
import ImageViewerModal from "@/components/image-viewer-modal"

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
  setImages: React.Dispatch<React.SetStateAction<ImageMedia[]>>
  onReload: () => void
}

export default function ImageGrid({ images, setImages, onReload }: ImageGridProps) {
    // For Renaming Modal
    const [renameTarget, setRenameTarget] = useState<ImageMedia | null>(null);
    const [saving, setSaving] = useState(false);

    // For Image Viewer Modal
    const [selectedImage, setSelectedImage] = useState<ImageMedia | null>(null);
    const [viewerOpen, setViewerOpen] = useState(false);

    // Clerk Auth
    const { getToken } = useAuth();

    async function deleteImage(id: string) {
        const token = await getToken()

        // Optimistic update (safe now)
        setImages(prev => prev.filter(img => img.id !== id))

        await axios.delete(`/api/v1/images/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        })

        // 🔁 ensure backend + UI are in sync
        onReload()
    }

    async function handleRename(newName: string) {
        if (!renameTarget) return;

        setSaving(true);
        const token = await getToken();

        // optimistic update
        setImages(prev =>
        prev.map(img =>
            img.id === renameTarget.id ? { ...img, name: newName } : img
        )
        );

        await axios.patch(`/api/v1/images/${renameTarget.id}/rename`,
        { name: newName },
        { headers: { Authorization: `Bearer ${token}` }}
        );

        setSaving(false);
        setRenameTarget(null);
        onReload();
    }

  if (images.length === 0) {
    return (
      <div className="text-muted-foreground text-center py-12">
        No images uploaded yet.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {images.map((img) => (
        <div
          key={img.id}
          className="group relative overflow-hidden rounded-xl border bg-background shadow-sm transition hover:shadow-md"
        >
          {/* Image */}
          <div className="aspect-square overflow-hidden bg-muted">
            <img
              src={img.thumbnailURL ?? img.originalURL}
              alt={img.name ?? "uploaded image"}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          </div>

          {/* Metadata */}
          <div className="space-y-1 p-3">
            <p className="truncate text-sm font-medium">{img.name}</p>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatBytes(img.sizeBytes)}</span>
              <span>{formatDate(img.createdAt)}</span>
            </div>
          </div>

          {/* Hover actions */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
            <div className="pointer-events-auto flex gap-2">
              <button
                // onClick={() => window.open(img.originalURL, "_blank")}
                onClick={() => {
                  setSelectedImage(img);
                  setViewerOpen(true);
                }}
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
              <button
                onClick={() => {
                    console.log("Deleting image with id:", img.id)
                    deleteImage(img.id)
                    console.log("Deleted image with id:", img.id)
                }}
                className="rounded-md bg-red-500 px-3 py-1 text-xs font-medium text-white hover:bg-red-600"
                >
                Delete
              </button>
              <button
                onClick={() => setRenameTarget(img)}
                className="rounded-md bg-white/90 px-3 py-1 text-xs font-medium text-black hover:bg-white"
                >
                Rename
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Rename Modal */}
      {renameTarget && (
        <RenameImageModal
          open
          initialName={renameTarget.name}
          loading={saving}
          onClose={() => setRenameTarget(null)}
          onSave={handleRename}
        />
      )}
      <ImageViewerModal
        image={selectedImage}
        open={viewerOpen}
        onClose={() => {
          setViewerOpen(false);
          setSelectedImage(null);
        }}
      />
    </div>
  )
}
