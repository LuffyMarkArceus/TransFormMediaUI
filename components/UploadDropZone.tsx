"use client"

import { useState } from "react"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { Media } from "@/types/media"
import { ALL_SUPPORTED_TYPES } from "@/types/media"
import { authHeaders, mediaPath } from "@/lib/api"
import { getApiErrorMessage, presignPutErrorMessage } from "@/lib/api-error"
import { formatCap, maxBytesFor, precheckFile } from "@/lib/upload-limits"
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

// Uploads run the presigned direct-to-storage flow: the backend validates
// the file and returns an id plus a time-limited PUT URL, the browser PUTs
// the bytes straight to storage (progress 5→95%), and a final complete call
// verifies the object and enqueues processing. Nothing large transits the
// backend, so files up to 500 MB work despite the ~32 MB request limit of
// the hosting frontend.
export default function UploadDropZone({ onUploadComplete }: UploadDropZoneProps) {
  const { getToken } = useAuth()
  const [dragging, setDragging] = useState(false)
  const [files, setFiles] = useState<UploadFileState[]>([])

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("video/")) return <Film className="w-4 h-4" />
    if (file.type.startsWith("audio/")) return <Music className="w-4 h-4" />
    return <Image className="w-4 h-4" />
  }

  const putToStorage = (
    uploadUrl: string,
    file: File,
    onProgress: (pct: number) => void
  ): Promise<void> =>
    new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open("PUT", uploadUrl)
      // The backend signs this exact value into the presigned URL; any
      // other Content-Type fails the signature check server-side.
      xhr.setRequestHeader("Content-Type", file.type)
      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable && evt.total > 0) {
          onProgress(Math.round((evt.loaded * 100) / evt.total))
        }
      }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve()
        } else {
          reject(
            new PresignPutError(
              presignPutErrorMessage(
                xhr.status,
                xhr.responseText,
                `Storage rejected the upload (HTTP ${xhr.status}).`
              )
            )
          )
        }
      }
      xhr.onerror = () =>
        reject(
          new PresignPutError(
            presignPutErrorMessage(
              0,
              "",
              "Could not reach storage to upload the file."
            )
          )
        )
      xhr.onabort = () => reject(new PresignPutError("Upload was cancelled."))
      xhr.send(file)
    })

  const uploadFile = async (fileState: UploadFileState) => {
    const { file } = fileState
    let beginId: string | null = null

    try {
      updateFileState(file, { status: "uploading", progress: 0, error: undefined })
      const headers = await authHeaders(getToken)

      // 1) Validate + reserve quota + get a presigned PUT URL.
      const begin = await axios.post(
        mediaPath("/uploads"),
        { name: file.name, contentType: file.type, size: file.size },
        { headers }
      )
      beginId = begin.data.id as string
      const uploadUrl = begin.data.uploadUrl as string
      updateFileState(file, { progress: 5 })

      // 2) Stream the bytes straight to storage.
      await putToStorage(uploadUrl, file, (pct) => {
        updateFileState(file, { progress: 5 + Math.round(pct * 0.9) })
      })

      // 3) Verify the stored object and flip it to "uploaded" so the
      //    worker picks it up.
      const res = await axios.post(mediaPath(`/${beginId}/complete`), {}, { headers })

      onUploadComplete(res.data)
      updateFileState(file, { status: "success", progress: 100 })
      toast.success(`${file.name} uploaded successfully`)
    } catch (err) {
      console.error("Upload error:", err)
      const fallback =
        err instanceof PresignPutError
          ? err.message
          : "Upload failed. Please try again."
      const msg = getApiErrorMessage(err, fallback)
      updateFileState(file, { status: "error", error: msg })
      toast.error(`${file.name}: ${msg}`)
      if (beginId) {
        // The pending row (if the PUT never happened) is reaped by the
        // backend's sweeper; nothing else to clean up here.
        console.info(`Pending upload ${beginId} left for the sweeper.`)
      }
    } finally {
      setTimeout(() => {
        setFiles((prevFiles) => prevFiles.filter((f) => f.file !== file))
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

      const capError = precheckFile(file)
      if (capError) {
        toast.error(capError)
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
        <Image className="w-5 h-5 text-muted-foreground" />
        <Film className="w-5 h-5 text-muted-foreground" />
        <Music className="w-5 h-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">Drag & drop images, videos, or audio</p>
      <p className="text-xs text-muted-foreground">
        or click to browse (images up to {formatCap(maxBytesFor("image/"))},
        video/audio up to {formatCap(maxBytesFor("video/mp4"))})
      </p>

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
                {f.status === "error" && f.error && (
                  <p className="text-[10px] leading-tight text-red-500">{f.error}</p>
                )}
              </div>
          ))}
        </div>
      )}
    </Card>
  )
}

// Marker so the catch block can tell storage-PUT failures (message already
// user-facing) apart from API errors without re-parsing.
class PresignPutError extends Error {}
