"use client"

import { useEffect, useState, useCallback } from "react"
import axios from "axios"
import { useAuth } from "@clerk/nextjs"

import ImageGrid from "./image-grid"
import { Card, CardContent } from "@/components/ui/card"
import UploadDropzone from "@/components/UploadDropZone"

import type { ImageMedia } from "@/types/media"

export default function DashboardPage() {
  const { getToken } = useAuth()

  const [images, setImages] = useState<ImageMedia[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchImages = useCallback(async () => {
    setLoading(true)
    try {
      const token = await getToken()
      const res = await axios.get("/api/v1/images", {
        headers: { Authorization: `Bearer ${token}` },
      })

      console.log("Fetched images:", res.data)

      // ✅ ALWAYS normalize
      setImages(Array.isArray(res.data) ? res.data : [])
    } finally {
      setLoading(false)
    }
  }, [getToken])

  useEffect(() => {
    fetchImages()
  }, [fetchImages])

  const totalSizeMB = (
    !images || images.length === 0 ? 0 :images.reduce((acc, img) => acc + img.sizeBytes, 0) /
    1024 /
    1024
  ).toFixed(2)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Manage and view your uploaded images
          </p>
        </div>
      </div>

      {/* Upload */}
      <UploadDropzone
        onUploadComplete={(media) => {
          setImages((prev) => [media, ...prev])
        }}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Images</p>
            <p className="text-2xl font-bold">{!images || images.length === 0 ? 0 : images.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Storage Used</p>
            <p className="text-2xl font-bold">{totalSizeMB} MB</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading images…</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <ImageGrid
          images={images}
          setImages={setImages}
          onReload={fetchImages}
        />
      )}
    </div>
  )
}
