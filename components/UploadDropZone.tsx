"use client"

import { useCallback, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { ImageMedia } from "@/types/media"
import { toast } from "sonner"


interface UploadDropZoneProps {
  onUploadComplete: (media: ImageMedia) => void
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

  const MAX_FILE_SIZE_MB= 50 * 1024 * 1024 // 50 MB
  const ALLOWED_TYPES = ["image/jpeg", "image/png"]
  
  const uploadFile = async (fileState: UploadFileState) => {
      const token = await getToken()
      const formData = new FormData()
      formData.append("file", fileState.file)

    try {
      updateFileState(fileState.file, { status: "uploading", progress: 0 })

      const res = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/images`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        onUploadProgress: (evt) => {
          if (!evt.total) return
          const pct = Math.round((evt.loaded * 100) / evt.total)
          updateFileState(fileState.file, { progress: pct })
        },
      })

      console.log("Upload response:", res)

      onUploadComplete(res.data)
      updateFileState(fileState.file, { status: "success", progress: 100 })
      toast.success(`${fileState.file.name} uploaded successfully`)
    } catch (err) {
      console.error("Upload error:", err)
      const msg = "Upload failed. Please try again."
      updateFileState(fileState.file, { status: "error", error: msg })
      toast.error(`${fileState.file.name} ${msg}`)
    }
    finally {
      // Reset Upload Zone Card state after all uploads complete
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
      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`${file.name} is not a supported image format.`)
        return
      }
      
      // Validate file size
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast.error(`${file.name} exceeds the maximum size of ${MAX_FILE_SIZE_MB} MB.`)
        return
      }

      newFiles.push({ file, progress: 0, status: "pending" })
    })

    setFiles((prevFiles) => [...prevFiles, ...newFiles])
    
    // Start uploading files
    newFiles.forEach((fileState) => uploadFile(fileState))
  }

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setDragging(false)
      if (!e.dataTransfer.files?.length) return
      handleFiles(e.dataTransfer.files)
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
        accept={ALLOWED_TYPES.join(",")}                                                      // Accept only image files
        multiple
        className="absolute inset-0 cursor-pointer opacity-0"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files)
        }}
      />

      <p className="text-sm font-medium">Drag & drop images here</p>
      <p className="text-xs text-muted-foreground">or click to browse</p>

      {files.length > 0 && (
        <div className="w-full max-w-xs pt-2">
          {
            files.map((f) => (
              <div key={f.file.name} className="flex flex-col gap-1">
                <div className="flex justify-between text-xs">
                  <span>{f.file.name}</span>
                  {f.status === "error" && <span className="text-red-500">✗</span>}
                  {f.status === "success" && <span className="text-green-500">✓</span>}
                </div>
                <Progress value={f.progress} />
              </div>
            ))
          }
        </div>
      )}
    </Card>
  )
}
