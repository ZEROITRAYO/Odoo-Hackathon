// Thin wrapper around sonner so existing code using useToast() / toast() still works
import { toast as sonnerToast } from "sonner"

type ToastOptions = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
  duration?: number
}

export function useToast() {
  const toast = ({ title, description, variant, duration }: ToastOptions) => {
    if (variant === "destructive") {
      sonnerToast.error(title ?? "Error", {
        description,
        duration: duration ?? 4000,
      })
    } else {
      sonnerToast.success(title ?? "", {
        description,
        duration: duration ?? 4000,
      })
    }
  }

  return { toast }
}

// Named export for direct use without hook
export const toast = ({ title, description, variant, duration }: ToastOptions) => {
  if (variant === "destructive") {
    sonnerToast.error(title ?? "Error", { description, duration: duration ?? 4000 })
  } else {
    sonnerToast.success(title ?? "", { description, duration: duration ?? 4000 })
  }
}
