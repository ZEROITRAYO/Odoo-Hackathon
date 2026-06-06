"use client"

import { useEffect } from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import type { ThemeProviderProps } from "next-themes"
import { useUIStore } from "@/lib/store"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      <ThemeSyncer />
      {children}
    </NextThemesProvider>
  )
}

// Applies the Zustand-persisted theme to <html> on mount and whenever it changes.
// next-themes handles the "system" case via its own media query listener.
function ThemeSyncer() {
  const { theme } = useUIStore()

  useEffect(() => {
    const root = document.documentElement
    if (theme === "dark") {
      root.classList.add("dark")
      root.classList.remove("light")
    } else if (theme === "light") {
      root.classList.remove("dark")
      root.classList.add("light")
    } else {
      // system
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      root.classList.toggle("dark", systemDark)
      root.classList.toggle("light", !systemDark)
    }
  }, [theme])

  return null
}
