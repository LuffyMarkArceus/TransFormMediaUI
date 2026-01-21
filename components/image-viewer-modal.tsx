"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ImageIcon, FileText, Calendar, Maximize, Copy, ExternalLink, Check, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

import { ImageMedia } from "@/types/media";
import { formatBytes, formatDate } from "@/lib/helpers";
import axios from "axios";

type ImageViewerModalProps = {
  image: ImageMedia | null;
  open: boolean;
  onClose: () => void;

  onNext?: () => void;
  onPrev?: () => void;
};

export default function ImageViewerModal({
  image,
  open,
  onClose,
  onNext,
  onPrev,
}: ImageViewerModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Reset state when image changes
  useEffect(() => {
    setLoading(true);
    setError(false);
  }, [image?.id]);

  // Lock body scroll
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);


  const viewerSrc = image?.processedURL ?? image?.originalURL;

  // Function to force download from S3/R2 (Cross-Origin)
  const handleDownload = useCallback(async () => {
    if (!image) return;
    setDownloading(true);
    try {
      const response = await axios.get(image.originalURL, {
        responseType: "blob",
      });

      // Create a local URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", image.name); // Forces the filename
      document.body.appendChild(link);
      link.click();

      // Cleanup
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed", err);
      // Fallback: Just open in new tab if CORS or Network fails
      window.open(image.originalURL, "_blank");
    } finally {
      setDownloading(false);
    }
  }, [image]);

  const handleCopy = useCallback(() => {
    if (!image) return;
    navigator.clipboard.writeText(image.processedURL ?? image.originalURL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [image]);

  useEffect(() => {
  if (!open || !image) return;

    function onKeyDown(e: KeyboardEvent) {
      // Ignore if user is typing somewhere
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;

      switch (e.key.toLowerCase()) {
        case "arrowleft":
          e.preventDefault();
          onPrev?.();
          break;
        case "arrowright":
          e.preventDefault();
          onNext?.();
          break;
        case "d":
          e.preventDefault();
          handleDownload();
          break;
        case "c":
          e.preventDefault();
          handleCopy();
          break;
        case "o":
          window.open(image?.originalURL, "_blank");
          break;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, image, onNext, onPrev, handleDownload, handleCopy]);

  if (!image) return null;

  return (
  <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      {/* Added max-w-none to override shadcn's default 512px limit */}
      <DialogContent 
        className="max-w-none w-[90vw] h-[90vh] bg-background p-0 overflow-hidden gap-0 flex flex-col border-none" 
        aria-describedby="image-modal-dialog"
      >
        <DialogHeader className="px-5 py-3 border-b bg-background flex-shrink-0">
          <DialogTitle className="text-sm font-semibold truncate flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-muted-foreground" />
            {image.name}
            <span className="text-zinc-300 truncate semi-bold">(processed preview)</span>
          </DialogTitle>
        </DialogHeader>
        
        {/* The "Viewport" */}
        <div className="relative flex flex-grow flex-shrink items-center justify-center bg-zinc-950 overflow-hidden">
          {loading && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-950 z-10">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
            </div>
          )}
          
          {error ? (
            <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
              <FileText className="w-10 h-10 opacity-20" />
              <p className="text-sm">Failed to load image preview.</p>
            </div>
          ) : (
            <img
              src={viewerSrc}
              alt={image.name}
              onLoad={() => setLoading(false)}
              onError={() => {
                setError(true);
                setLoading(false);
              }}
              // max-h-full and max-w-full ensure it scales to the big container
              className="max-h-full max-w-full object-contain transition-all duration-500 ease-in-out"
              style={{ opacity: loading ? 0 : 1 }}
            />
          )}

          {/* Nav buttons */}
          {onPrev && (
            <button
              onClick={onPrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
          )}
          {onNext && (
            <button
              onClick={onNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          )}
        </div>

        <div className="bg-muted/30 border-t p-4 sm:px-10 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-10 flex-grow">
              <MetadataItem 
                icon={<Maximize className="w-4 h-4" />}
                label="Resolution" 
                value={`${image.width} × ${image.height}`} 
              />
              <MetadataItem 
                icon={<FileText className="w-4 h-4" />}
                label="Size" 
                value={formatBytes(image.sizeBytes)} 
              />
              <MetadataItem 
                icon={<ImageIcon className="w-4 h-4" />}
                label="Format" 
                value={image.format.toUpperCase()} 
              />
              <MetadataItem 
                icon={<Calendar className="w-4 h-4" />}
                label="Uploaded" 
                value={formatDate(image.createdAt)} 
              />
            </div>

            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                disabled={downloading}
                className="h-9 px-5 font-medium " 
                onClick={handleDownload}
              >
                {downloading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Raw
              </Button>

              <Button 
                size="sm" 
                variant="outline" 
                className="h-9 px-3" 
                title="Open Original"
                onClick={() => window.open(image.originalURL, "_blank")}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>

              <Button 
                size="sm" 
                variant="outline" 
                className="h-9 px-5 font-medium"
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <Check className="mr-2 h-4 w-4 text-green-500" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    URL
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Reusable Metadata Item Component
 */
function MetadataItem({ 
  label, 
  value, 
  icon 
}: { 
  label: string; 
  value: string; 
  icon?: React.ReactNode 
}) {
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <span>{value}</span>
    </div>
  );
}