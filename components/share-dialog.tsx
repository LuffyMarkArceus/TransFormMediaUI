"use client"

import { useState } from "react"
import axios from "axios"
import { useAuth } from "@clerk/nextjs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Copy, Check, Share2, Loader2 } from "lucide-react"
import { authHeaders, mediaPath } from "@/lib/api"
import { toast } from "sonner"

interface ShareDialogProps {
  mediaId: string
  mediaName: string
  open: boolean
  onClose: () => void
}

export default function ShareDialog({ mediaId, mediaName, open, onClose }: ShareDialogProps) {
  const { getToken } = useAuth()
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    try {
      const headers = await authHeaders(getToken)
      const res = await axios.post<{ shareURL: string }>(
        mediaPath(`/${mediaId}/share`),
        {},
        { headers }
      )
      setShareUrl(res.data.shareURL)
    } catch {
      setError("Failed to generate share link.")
      toast.error("Failed to generate share link")
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    toast.success("Share link copied to clipboard")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-4 h-4" />
            Share &ldquo;{mediaName}&rdquo;
          </DialogTitle>
          <DialogDescription>
            Generate a shareable link that expires in 7 days.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!shareUrl && !error && (
            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Share2 className="mr-2 h-4 w-4" />
                  Generate Share Link
                </>
              )}
            </Button>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {shareUrl && (
            <div className="flex items-center gap-2">
              <Input
                value={shareUrl}
                readOnly
                className="flex-1"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button size="icon" variant="outline" onClick={handleCopy}>
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
