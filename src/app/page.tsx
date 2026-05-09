'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import LoginPage from '@/components/pages/LoginPage'
import DashboardPage from '@/components/pages/DashboardPage'
import InstagramPage from '@/components/pages/InstagramPage'
import DrivePage from '@/components/pages/DrivePage'
import PostPage from '@/components/pages/PostPage'
import SettingsPage from '@/components/pages/SettingsPage'
import LogsPage from '@/components/pages/LogsPage'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

export default function Home() {
  const { user, token, currentPage } = useAppStore()

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user || !token) {
      useAppStore.getState().setCurrentPage('login')
    }
  }, [user, token])

  // Show login if not authenticated
  if (!user || !token) {
    return <LoginPage />
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />
      case 'instagram':
        return <InstagramPage />
      case 'drive':
        return <DrivePage />
      case 'post':
        return <PostPage />
      case 'settings':
        return <SettingsPage />
      case 'logs':
        return <LogsPage />
      default:
        return <DashboardPage />
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {renderPage()}
        </main>
        {/* Footer */}
        <footer className="border-t border-zinc-800 px-4 py-3 lg:px-6">
          <p className="text-center text-zinc-600 text-xs">
            ReelFlow — Instagram Reel Automation SaaS © {new Date().getFullYear()}
          </p>
        </footer>
      </div>
    </div>
  )
}
