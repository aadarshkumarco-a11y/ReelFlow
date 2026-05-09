import { create } from 'zustand'

interface User {
  id: string
  email: string
  name: string
}

interface AppState {
  user: User | null
  token: string | null
  sidebarOpen: boolean
  currentPage: string
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  setSidebarOpen: (open: boolean) => void
  setCurrentPage: (page: string) => void
  logout: () => void
}

export const useAppStore = create<AppState>((set) => ({
  user: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('reelflow_user') || 'null') : null,
  token: typeof window !== 'undefined' ? localStorage.getItem('reelflow_token') : null,
  sidebarOpen: true,
  currentPage: 'dashboard',
  setUser: (user) => {
    if (typeof window !== 'undefined') {
      if (user) localStorage.setItem('reelflow_user', JSON.stringify(user))
      else localStorage.removeItem('reelflow_user')
    }
    set({ user })
  },
  setToken: (token) => {
    if (typeof window !== 'undefined') {
      if (token) localStorage.setItem('reelflow_token', token)
      else localStorage.removeItem('reelflow_token')
    }
    set({ token })
  },
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setCurrentPage: (page) => set({ currentPage: page }),
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('reelflow_token')
      localStorage.removeItem('reelflow_user')
    }
    set({ user: null, token: null, currentPage: 'login' })
  },
}))
