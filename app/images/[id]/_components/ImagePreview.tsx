"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import type { ProcessParams } from "@/lib/image-process-params";
import { authHeaders, mediaProcessPath } from "@/lib/api";
import { ImageSkeleton } from "./ImageSkeleton";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

interface ImagePreviewProps {
  imageId: string;
  params: ProcessParams;
  previewParams?: ProcessParams;
  isProcessing: boolean;
  onLoadComplete: () => void;
  onLoadError: () => void;
}

export function ImagePreview({
  imageId,
  params,
  previewParams,
  isProcessing,
  onLoadComplete,
  onLoadError,
}: ImagePreviewProps) {
  const { getToken } = useAuth();
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [committedParams, setCommittedParams] = useState(params);
  const [comparing, setComparing] = useState(false);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    setCommittedParams(params);
  }, [imageId]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const previewFilter = useMemo(() => {
    if (comparing || !previewParams) return "";
    const parts: string[] = [];
    if (previewParams.blur && previewParams.blur > 0 && previewParams.blur !== committedParams.blur) {
      parts.push(`blur(${previewParams.blur}px)`);
    }
    if (previewParams.grayscale && !committedParams.grayscale) {
      parts.push("grayscale(1)");
    }
    return parts.join(" ");
  }, [previewParams, committedParams, comparing]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

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
        if (cancelled) return;

        const newUrl = URL.createObjectURL(blob);
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
        }
        objectUrlRef.current = newUrl;
        setObjectUrl(newUrl);
        setCommittedParams(params);
        setLoading(false);
        onLoadComplete();
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load processed image.")
          setLoading(false);
          onLoadError();
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [imageId, params, getToken, onLoadComplete, onLoadError]);

  return (
    <div className="relative flex items-center justify-center rounded-lg border bg-muted/30 p-4">
      {loading && !error && <ImageSkeleton />}

      {error && (
        <p className="max-w-md text-center text-sm text-destructive">{error}</p>
      )}

      {objectUrl && !error && (
        <div className="relative">
          <img
            src={objectUrl}
            alt="Processed image"
            className={`max-h-[70vh] max-w-full rounded-md object-contain ${loading ? "opacity-0" : "opacity-100"}`}
            style={previewFilter ? { filter: previewFilter } : undefined}
            draggable={false}
          />
          <button
            type="button"
            onMouseDown={() => setComparing(true)}
            onMouseUp={() => setComparing(false)}
            onMouseLeave={() => setComparing(false)}
            onTouchStart={() => setComparing(true)}
            onTouchEnd={() => setComparing(false)}
            className="absolute bottom-2 left-2 rounded-md bg-background/80 px-2 py-1 text-xs text-muted-foreground backdrop-blur-sm transition hover:bg-background/90 active:scale-95"
          >
            {comparing ? "Release to compare" : "Hold to compare"}
          </button>
        </div>
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

