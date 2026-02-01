import { Skeleton } from "@/components/ui/skeleton"

export function ImageSkeleton() {
  return (
    <Skeleton className="aspect-video w-full rounded-lg bg-gradient-to-r from-muted via-muted/50 to-muted" />
  )
}