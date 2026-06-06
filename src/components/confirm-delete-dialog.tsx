"use client"

import { Loader2, Trash2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

interface ConfirmDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  onConfirm: () => void
  isLoading?: boolean
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title = "Delete this item?",
  description = "This action cannot be undone.",
  onConfirm,
  isLoading,
}: ConfirmDeleteDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-2">
            <Trash2 className="w-5 h-5 text-red-500" />
          </div>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            variant="destructive"
            className="gap-2"
          >
            {isLoading ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Deleting…</> : "Delete"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
