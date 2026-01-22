"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

import ImageGrid from "./image-grid";
import { Card, CardContent } from "@/components/ui/card";
import UploadDropzone from "@/components/UploadDropZone";

import type { ImageMedia } from "@/types/media";

export default function DashboardPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { isLoaded, isSignedIn } = useUser();

  const [images, setImages] = useState<ImageMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ Redirect AFTER render
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace("/");
    }
  }, [isLoaded, isSignedIn, router]);

  const fetchImages = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();

      const res = await axios.get("/api/v1/images", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setImages(Array.isArray(res.data) ? res.data : []);
    } catch {
      setError("Failed to load images. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchImages();
    }
  }, [isLoaded, isSignedIn, fetchImages]);

  if (!isLoaded || !isSignedIn) {
    return <p className="p-6 text-muted-foreground">Loading…</p>;
  }

  const totalSizeMB = (
    images.reduce((acc, img) => acc + img.sizeBytes, 0) /
    1024 /
    1024
  ).toFixed(2);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Manage and view your uploaded images
        </p>
      </div>

      {/* Upload */}
      <UploadDropzone
        onUploadComplete={(media) => {
          setImages((prev) => [media, ...prev]);
        }}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Images</p>
            <p className="text-2xl font-bold">{images.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Storage Used</p>
            <p className="text-2xl font-bold">{totalSizeMB} MB</p>
          </CardContent>
        </Card>
      </div>

      {/* Content */}
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
  );
}
