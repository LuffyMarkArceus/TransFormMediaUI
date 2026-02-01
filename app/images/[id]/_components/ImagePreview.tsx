"use client";

import { useMemo, useState, useEffect } from "react";
import type { ProcessParams } from "@/lib/image-process-params";
import ErrorPage from "../error";
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

export function ImagePreview({ imageId, params, isProcessing, onLoadComplete, onLoadError }: ImagePreviewProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const src = useMemo(() => {
        const sp = new URLSearchParams();
        if (params.w) sp.set("w", String(params.w));
        if (params.h) sp.set("h", String(params.h));
        if (params.format) sp.set("format", params.format);
        if (params.q) sp.set("q", String(params.q));

        return `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/images/${imageId}/process?${sp.toString()}`;

    }, [imageId, params]);
    
    // Reset loading/error state on src change
    useEffect(() => {
        setLoading(true);
        setError(false);
    }, [src]);

    return (
        <div className="relative flex items-center justify-center rounded-lg border bg-muted/30 p-4">
            {loading && !error && <ImageSkeleton />}

            <img
                key={src} // 🚨 Critical: forces reload when params change - avoids stale & race condition issues. 
                src={src}
                alt="Processed image"
                className={`max-h-[70vh] max-w-full rounded-md object-contain ${loading ? "opacity-0" : "opacity-100"}`}
                onLoad={() => {
                    setLoading(false);
                    onLoadComplete();
                }}
                onError={() => {
                    setLoading(false)
                    onLoadError();
                }}
                draggable={false}
            />
            {isProcessing && (
                <Card className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/60 backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                        <Label>Processing...</Label>
                    </div>
                </Card>
            )}
        </div>
  )
}