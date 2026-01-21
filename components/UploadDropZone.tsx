"use client"

import { useCallback, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { ImageMedia } from "@/types/media"


interface UploadDropZoneProps {
  onUploadComplete: (media: ImageMedia) => void
}

export default function UploadDropZone({ onUploadComplete }: UploadDropZoneProps) {
  const { getToken } = useAuth()
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const uploadFile = async (file: File) => {
    try {
      setUploading(true)
      setProgress(0)
      setError(null)

      const token = await getToken()

      const formData = new FormData()
      formData.append("file", file)

      const res = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/images`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        onUploadProgress: (evt) => {
          if (!evt.total) return
          const pct = Math.round((evt.loaded * 100) / evt.total)
          setProgress(pct)
        },
      })

      console.log("Upload response:", res)

      onUploadComplete(res.data)
    } catch (err) {
      console.error("Upload error:", err)
      setError("Upload failed. Please try again.")
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setDragging(false)
      if (!e.dataTransfer.files?.length) return
      uploadFile(e.dataTransfer.files[0])
    },
    []
  )

  return (
    <Card
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`relative flex flex-col items-center justify-center gap-2 border-2 border-dashed p-6 text-center transition ${
        dragging ? "border-primary bg-primary/5" : "border-muted"
      }`}
    >
      <input
        type="file"
        accept="image/*"
        className="absolute inset-0 cursor-pointer opacity-0"
        onChange={(e) => {
          if (e.target.files?.[0]) uploadFile(e.target.files[0])
        }}
      />

      <p className="text-sm font-medium">Drag & drop images here</p>
      <p className="text-xs text-muted-foreground">or click to browse</p>

      {uploading && (
        <div className="w-full max-w-xs pt-2">
          <Progress value={progress} />
          <p className="mt-1 text-xs text-muted-foreground">Uploading… {progress}%</p>
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </Card>
  )
}
