// src/lib/store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  // Sidebar
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void

  // Theme
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void

  // Modals
  createVendorOpen: boolean
  setCreateVendorOpen: (open: boolean) => void

  createRFQOpen: boolean
  setCreateRFQOpen: (open: boolean) => void

  // Notification badge count
  unreadCount: number
  setUnreadCount: (count: number) => void
  decrementUnread: () => void
  clearUnread: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

      theme: 'light',
      setTheme: (theme) => {
        set({ theme })
        if (typeof document !== 'undefined') {
          const root = document.documentElement
          if (theme === 'dark') {
            root.classList.add('dark')
            root.classList.remove('light')
          } else if (theme === 'light') {
            root.classList.remove('dark')
            root.classList.add('light')
          } else {
            // system
            const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
            root.classList.toggle('dark', systemDark)
            root.classList.toggle('light', !systemDark)
          }
        }
      },

      createVendorOpen: false,
      setCreateVendorOpen: (open) => set({ createVendorOpen: open }),

      createRFQOpen: false,
      setCreateRFQOpen: (open) => set({ createRFQOpen: open }),

      unreadCount: 0,
      setUnreadCount: (count) => set({ unreadCount: count }),
      decrementUnread: () => set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),
      clearUnread: () => set({ unreadCount: 0 }),
    }),
    {
      name: 'vendorbridge-ui',
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
)
