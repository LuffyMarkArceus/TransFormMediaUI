"use client"

import { useState } from "react"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { Media } from "@/types/media"
import { ALL_SUPPORTED_TYPES } from "@/types/media"
import { authHeaders, mediaPath } from "@/lib/api"
import { getApiErrorMessage } from "@/lib/api-error"
import { toast } from "sonner"
import { Film, Music, Image } from "lucide-react"


interface UploadDropZoneProps {
  onUploadComplete: (media: Media) => void
}

interface UploadFileState {
  file: File
  progress: number
  error?: string
  status: "pending" | "uploading" | "success" | "error"
}

export default function UploadDropZone({ onUploadComplete }: UploadDropZoneProps) {
  const { getToken } = useAuth()
  const [dragging, setDragging] = useState(false)
  const [files, setFiles] = useState<UploadFileState[]>([])

  const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("video/")) return <Film className="w-4 h-4" />
    if (file.type.startsWith("audio/")) return <Music className="w-4 h-4" />
    return <Image className="w-4 h-4" alt="" />
  }

  const uploadFile = async (fileState: UploadFileState) => {
    const formData = new FormData()
    formData.append("file", fileState.file)

    try {
      updateFileState(fileState.file, { status: "uploading", progress: 0 })

      const headers = await authHeaders(getToken)
      const res = await axios.post(mediaPath(), formData, {
        headers,
        onUploadProgress: (evt) => {
          if (!evt.total) return
          const pct = Math.round((evt.loaded * 100) / evt.total)
          updateFileState(fileState.file, { progress: pct })
        },
      })

      onUploadComplete(res.data)
      updateFileState(fileState.file, { status: "success", progress: 100 })
      toast.success(`${fileState.file.name} uploaded successfully`)
    } catch (err) {
      console.error("Upload error:", err)
      const msg = getApiErrorMessage(
        err,
        "Upload failed. Please try again."
      )
      updateFileState(fileState.file, { status: "error", error: msg })
      toast.error(`${fileState.file.name}: ${msg}`)
    }
    finally {
      setTimeout(() => {
        setFiles((prevFiles) => prevFiles.filter((f) => f.file !== fileState.file))
      }, 3000)
    }

  }

  const updateFileState = (file: File, updates: Partial<UploadFileState>) => {
    setFiles((prevFiles) =>
      prevFiles.map((f) => (f.file === file ? { ...f, ...updates } : f))
    )
  }

  const handleFiles = (selectedFiles: FileList) => {
    const newFiles: UploadFileState[] = []

    Array.from(selectedFiles).forEach((file) => {
      if (!ALL_SUPPORTED_TYPES.includes(file.type)) {
        toast.error(`${file.name} is not a supported format.`)
        return
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast.error(`${file.name} exceeds the maximum size of 500 MB.`)
        return
      }

      newFiles.push({ file, progress: 0, status: "pending" })
    })

    setFiles((prevFiles) => [...prevFiles, ...newFiles])

    newFiles.forEach((fileState) => uploadFile(fileState))
  }

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    if (!e.dataTransfer.files?.length) return
    handleFiles(e.dataTransfer.files)
  }

  const acceptedTypes = ALL_SUPPORTED_TYPES.join(",")

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
        accept={acceptedTypes}
        multiple
        className="absolute inset-0 cursor-pointer opacity-0"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files)
        }}
      />

      <div className="flex gap-3">
        <Image className="w-5 h-5 text-muted-foreground" alt="" />
        <Film className="w-5 h-5 text-muted-foreground" />
        <Music className="w-5 h-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">Drag & drop images, videos, or audio</p>
      <p className="text-xs text-muted-foreground">or click to browse</p>

      {files.length > 0 && (
        <div className="w-full max-w-xs pt-2">
          {files.map((f) => (
              <div key={f.file.name} className="flex flex-col gap-1">
                <div className="flex justify-between text-xs items-center">
                  <span className="flex items-center gap-1">
                    {getFileIcon(f.file)}
                    <span className="truncate max-w-[150px]">{f.file.name}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    {f.status === "error" && (
                      <>
                        <span className="text-red-500">✗</span>
                        <button
                          onClick={() => uploadFile(f)}
                          className="text-xs text-primary hover:underline"
                        >
                          Retry
                        </button>
                      </>
                    )}
                    {f.status === "success" && <span className="text-green-500">✓</span>}
                  </span>
                </div>
                <Progress value={f.progress} />
              </div>
          ))}
        </div>
      )}
    </Card>
  )
}
