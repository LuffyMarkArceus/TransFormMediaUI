"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import type { ProcessParams } from "@/lib/image-process-params";
import { authHeaders, mediaProcessPath } from "@/lib/api";
import { ImageSkeleton } from "./ImageSkeleton";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

interface ImagePreviewProps {
  imageId: string;
  params: ProcessParams;
  isProcessing: boolean;
  onLoadComplete: () => void;
  onLoadError: () => void;
}

export function ImagePreview({
  imageId,
  params,
  isProcessing,
  onLoadComplete,
  onLoadError,
}: ImagePreviewProps) {
  const { getToken } = useAuth();
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let revoked = false;
    let currentUrl: string | null = null;

    const load = async () => {
      setLoading(true);
      setError(null);
      setObjectUrl(null);

      const sp = new URLSearchParams();
      if (params.w) sp.set("w", String(params.w));
      if (params.h) sp.set("h", String(params.h));
      if (params.format) sp.set("format", params.format);
      if (params.q) sp.set("q", String(params.q));
      if (params.blur) sp.set("blur", String(params.blur));
      if (params.grayscale) sp.set("grayscale", "true");
      if (params.cw) sp.set("cw", String(params.cw));
      if (params.ch) sp.set("ch", String(params.ch));
      if (params.gravity) sp.set("gravity", params.gravity);

      try {
        const headers = await authHeaders(getToken);
        const res = await fetch(mediaProcessPath(imageId, sp), { headers });

        if (!res.ok) {
          let message = `Processing failed (${res.status})`
          try {
            const body = await res.json()
            if (body?.error && typeof body.error === "string") {
              message = body.error
            }
          } catch {
            /* ignore */
          }
          throw new Error(message)
        }

        const blob = await res.blob();
        if (revoked) return;

        currentUrl = URL.createObjectURL(blob);
        setObjectUrl(currentUrl);
        setLoading(false);
        onLoadComplete();
      } catch (e) {
        if (!revoked) {
          setError(e instanceof Error ? e.message : "Failed to load processed image.")
          setLoading(false);
          onLoadError();
        }
      }
    };

    void load();

    return () => {
      revoked = true;
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [imageId, params, getToken, onLoadComplete, onLoadError]);

  return (
    <div className="relative flex items-center justify-center rounded-lg border bg-muted/30 p-4">
      {loading && !error && <ImageSkeleton />}

      {error && (
        <p className="max-w-md text-center text-sm text-destructive">{error}</p>
      )}

      {objectUrl && !error && (
        <img
          src={objectUrl}
          alt="Processed image"
          className={`max-h-[70vh] max-w-full rounded-md object-contain ${loading ? "opacity-0" : "opacity-100"}`}
          draggable={false}
        />
      )}

      {isProcessing && (
        <Card className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/60 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            <Label>Processing...</Label>
          </div>
        </Card>
      )}
    </div>
  );
}

