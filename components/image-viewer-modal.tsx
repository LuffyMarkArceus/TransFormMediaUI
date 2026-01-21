"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { ImageMedia } from "@/types/media";

type ImageViewerModalProps = {
  image: ImageMedia | null;
  open: boolean;
  onClose: () => void;
};

export default function ImageViewerModal({
  image,
  open,
  onClose,
}: ImageViewerModalProps) {
  if (!image) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-5xl bg-background p-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle className="text-base font-medium truncate">
            {image.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-center bg-black/10">
          <img
            src={image.processedURL }
            alt={image.name}
            className="max-h-[80vh] w-auto object-contain"
          />
        </div>

        <div className="flex items-center justify-between px-4 py-3 text-xs text-muted-foreground border-t">
          <span>
            Original Resolution : {image.width} × {image.height}
          </span>
          <span>
            {(image.sizeBytes / 1024 / 1024).toFixed(2)} MB
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
