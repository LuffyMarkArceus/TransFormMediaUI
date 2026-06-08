"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import axios from "axios"
import { useAuth, useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { Search, ArrowUpDown, Trash2 } from "lucide-react"

import MediaGrid from "./media-grid"
import { Card, CardContent } from "@/components/ui/card"
import UploadDropzone from "@/components/UploadDropZone"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import type { Media, MediaType } from "@/types/media"
import { authHeaders, mediaListPath, type PaginatedResponse } from "@/lib/api"
import { ImageIcon, Film, Music, Image } from "lucide-react"

type DashboardTab = MediaType | "all" | "trash"
const PAGE_SIZE = 20

export default function DashboardPage() {
  const router = useRouter()
  const { getToken } = useAuth()
  const { isLoaded, isSignedIn } = useUser()

  const [allMedia, setAllMedia] = useState<Media[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<DashboardTab>("all")
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState("created_at")
  const [sortDir, setSortDir] = useState("desc")
  const [offset, setOffset] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [debouncedSearch, setDebouncedSearch] = useState("")

  const isTrash = activeTab === "trash"

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(search)
      setOffset(0)
      setAllMedia([])
    }, 400)
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current) }
  }, [search])

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/")
    }
  }, [isLoaded, isSignedIn, router])

  const fetchMedia = useCallback(async (append = false) => {
    try {
      if (append) {
        setLoadingMore(true)
      } else {
        setLoading(true)
      }
      const headers = await authHeaders(getToken)
      const currentOffset = append ? offset : 0
      const res = await axios.get<PaginatedResponse<Media>>(
        mediaListPath({
          type: activeTab === "all" || isTrash ? undefined : activeTab,
          status: isTrash ? "trashed" : undefined,
          search: debouncedSearch || undefined,
          sortBy,
          sortDir,
          limit: PAGE_SIZE,
          offset: currentOffset,
        }),
        { headers }
      )

      const { data, total: totalCount } = res.data
      setTotal(totalCount)
      if (append) {
        setAllMedia((prev) => [...prev, ...data])
      } else {
        setAllMedia(data)
        setOffset(0)
      }
    } catch {
      setError("Failed to load media. Please try again.")
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [getToken, activeTab, debouncedSearch, sortBy, sortDir, offset, isTrash])

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchMedia(false)
    }
  }, [isLoaded, isSignedIn, activeTab, debouncedSearch, sortBy, sortDir, refreshKey])

  const handleLoadMore = () => {
    const newOffset = offset + PAGE_SIZE
    setOffset(newOffset)
    fetchMedia(true)
  }

  const handleReload = () => {
    setOffset(0)
    setAllMedia([])
    setRefreshKey((k) => k + 1)
  }

  const handleTabChange = (v: string) => {
    setActiveTab(v as DashboardTab)
    setOffset(0)
    setAllMedia([])
  }

  const handleSortChange = (v: string) => {
    if (v.startsWith("-")) {
      setSortBy(v.slice(1))
      setSortDir("desc")
    } else if (v.startsWith("+")) {
      setSortBy(v.slice(1))
      setSortDir("asc")
    } else {
      setSortBy(v)
      setSortDir("desc")
    }
    setOffset(0)
    setAllMedia([])
  }

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

  const hasMore = allMedia.length < total

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Manage and view your uploaded images, videos, and audio
        </p>
      </div>

      {!isTrash && (
        <UploadDropzone onUploadComplete={(media) => {
          setAllMedia((prev) => [media, ...prev])
          setTotal((t) => t + 1)
        }} />
      )}

      {!isTrash && (
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
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortDir === "desc" ? sortBy : `+${sortBy}`} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Newest first</SelectItem>
              <SelectItem value="+created_at">Oldest first</SelectItem>
              <SelectItem value="name">Name A-Z</SelectItem>
              <SelectItem value="+name">Name Z-A</SelectItem>
              <SelectItem value="size_bytes">Largest first</SelectItem>
              <SelectItem value="+size_bytes">Smallest first</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="all" className="flex items-center gap-1">
            <Image className="w-4 h-4" />
            All ({!isTrash ? total : "-"})
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
          <TabsTrigger value="trash" className="flex items-center gap-1">
            <Trash2 className="w-4 h-4" />
            Trash
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {loading ? (
            <p className="text-muted-foreground">Loading media…</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : allMedia.length === 0 ? (
            <div className="text-muted-foreground text-center py-12">
              {debouncedSearch ? "No media matching your search." : isTrash ? "Trash is empty." : "No media uploaded yet."}
            </div>
          ) : (
            <>
              <MediaGrid
                mediaItems={allMedia}
                setMediaItems={setAllMedia}
                onReload={handleReload}
                isTrash={isTrash}
              />
              {hasMore && (
                <div className="flex justify-center pt-6">
                  <button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    {loadingMore ? "Loading..." : `Load More (${allMedia.length}/${total})`}
                  </button>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
