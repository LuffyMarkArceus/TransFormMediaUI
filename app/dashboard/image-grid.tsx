"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"

type ImageMedia = {
  id: string
  userID: string
  name: string
  type: "image"
  originalURL: string
  format: string
  sizeBytes: number
  status: string
  createdAt: string
}

export default function ImageGrid() {
  const { getToken } = useAuth()
  const [images, setImages] = useState<ImageMedia[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchImages() {
      try {
        const token = await getToken()
        // console.log("Fetched token:", token)

        const res = await axios.get("/api/v1/images", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        console.log("API response:", res)

        if (res.statusText !== "OK") {
          throw new Error("Failed to fetch images")
        }

        const data = await res.data
        setImages(data)
      } catch (err) {
        setError("Could not load images")
      } finally {
        setLoading(false)
      }
    }

    fetchImages()
  }, [getToken])

  if (loading) {
    return <div className="text-muted-foreground">Loading images...</div>
  }

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  if (images.length === 0) {
    return (
      <div className="text-muted-foreground text-center py-12">
        No images uploaded yet.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {images.map((img) => (
        <div
          key={img.id}
          className="rounded-lg border overflow-hidden bg-background"
        >
          <div className="relative aspect-square">
            {/* <Image
              src={img.originalURL}
              alt="uploaded image"
              fill
              className="object-cover"
            /> */}
            <img
                src={img.originalURL}
                alt="uploaded image"
                className="absolute inset-0 w-full h-full object-cover"
                />
          </div>

          <div className="p-2 text-xs text-muted-foreground space-y-1">
            <h4><strong>{img.name}</strong></h4>
            <span className="flex justify-between">
                <div>{(img.sizeBytes / 1024).toFixed(1)} KB</div>
                <div>{new Date(img.createdAt).toDateString()}</div>
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}