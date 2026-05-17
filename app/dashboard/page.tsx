"use client"

import { useEffect, useState, useCallback } from "react"
import axios from "axios"
import { useAuth, useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

import MediaGrid from "./media-grid"
import { Card, CardContent } from "@/components/ui/card"
import UploadDropzone from "@/components/UploadDropZone"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import type { Media, MediaType } from "@/types/media"
import { mediaPath, authHeaders } from "@/lib/api"
import { ImageIcon, Film, Music, Image } from "lucide-react"

export default function DashboardPage() {
  const router = useRouter()
  const { getToken } = useAuth()
  const { isLoaded, isSignedIn } = useUser()

  const [allMedia, setAllMedia] = useState<Media[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<MediaType | "all">("all")

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/")
    }
  }, [isLoaded, isSignedIn, router])

  const fetchMedia = useCallback(async () => {
    try {
      setLoading(true)
      const headers = await authHeaders(getToken)
      const res = await axios.get(mediaPath(), { headers })

      setAllMedia(Array.isArray(res.data) ? res.data : [])
    } catch {
      setError("Failed to load media. Please try again.")
    } finally {
      setLoading(false)
    }
  }, [getToken])

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchMedia()
    }
  }, [isLoaded, isSignedIn, fetchMedia])

  if (!isLoaded || !isSignedIn) {
    return <p className="p-6 text-muted-foreground">Loading…</p>
  }

  const totalSizeMB = (
    allMedia.reduce((acc, m) => acc + m.sizeBytes, 0) /
    1024 /
    1024
  ).toFixed(2)

  const imageCount = allMedia.filter((m) => m.type === "image").length
  const videoCount = allMedia.filter((m) => m.type === "video").length
  const audioCount = allMedia.filter((m) => m.type === "audio").length

  const filteredMedia = activeTab === "all"
    ? allMedia
    : allMedia.filter((m) => m.type === activeTab)

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Manage and view your uploaded images, videos, and audio
        </p>
      </div>

      <UploadDropzone
        onUploadComplete={(media) => {
          setAllMedia((prev) => [media, ...prev])
        }}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <ImageIcon className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">Images</p>
              <p className="text-2xl font-bold">{imageCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Film className="w-8 h-8 text-purple-500" />
            <div>
              <p className="text-sm text-muted-foreground">Videos</p>
              <p className="text-2xl font-bold">{videoCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Music className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Audio</p>
              <p className="text-2xl font-bold">{audioCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Storage Used</p>
            <p className="text-2xl font-bold">{totalSizeMB} MB</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MediaType | "all")}>
        <TabsList>
          <TabsTrigger value="all" className="flex items-center gap-1">
            <Image className="w-4 h-4" />
            All ({allMedia.length})
          </TabsTrigger>
          <TabsTrigger value="image" className="flex items-center gap-1">
            <ImageIcon className="w-4 h-4" />
            Images ({imageCount})
          </TabsTrigger>
          <TabsTrigger value="video" className="flex items-center gap-1">
            <Film className="w-4 h-4" />
            Videos ({videoCount})
          </TabsTrigger>
          <TabsTrigger value="audio" className="flex items-center gap-1">
            <Music className="w-4 h-4" />
            Audio ({audioCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {loading ? (
            <p className="text-muted-foreground">Loading media…</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <MediaGrid
              mediaItems={filteredMedia}
              setMediaItems={setAllMedia}
              onReload={fetchMedia}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
