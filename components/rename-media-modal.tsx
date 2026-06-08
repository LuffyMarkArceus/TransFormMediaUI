"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"

type Props = {
  open: boolean
  initialName: string
  loading?: boolean
  onClose: () => void
  onSave: (name: string) => void
}

export default function RenameMediaModal({
  open,
  initialName,
  loading,
  onClose,
  onSave,
}: Props) {
  const [name, setName] = useState(initialName)

  useEffect(() => {
    setName(initialName)
  }, [initialName])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename media</DialogTitle>
        </DialogHeader>

        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter media name"
          autoFocus
        />

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!name.trim() || loading}
            onClick={() => onSave(name.trim())}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
