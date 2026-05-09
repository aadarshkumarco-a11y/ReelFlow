'use client'

import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Menu, LogOut, User } from 'lucide-react'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const pageTitles: Record<string, { title: string; description: string }> = {
  dashboard: { title: 'Dashboard', description: 'Overview of your ReelFlow activity' },
  instagram: { title: 'Instagram', description: 'Manage connected accounts' },
  drive: { title: 'Google Drive', description: 'Manage video folders' },
  post: { title: 'Post Reel', description: 'Publish a new Instagram Reel' },
  settings: { title: 'Settings', description: 'Customize your preferences' },
  logs: { title: 'Activity Logs', description: 'View all activity history' },
}

export default function Header() {
  const { currentPage, setSidebarOpen, user, logout } = useAppStore()
  const pageInfo = pageTitles[currentPage] || { title: 'Dashboard', description: '' }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'RF'

  return (
    <header className="sticky top-0 z-30 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden text-zinc-400 hover:text-white"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-white">{pageInfo.title}</h1>
            <p className="text-xs text-zinc-500 hidden sm:block">{pageInfo.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-zinc-300 hidden sm:block">{user?.name || 'User'}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
              <DropdownMenuItem className="text-zinc-300 focus:bg-zinc-800 focus:text-white">
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem
                onClick={logout}
                className="text-red-400 focus:bg-red-500/10 focus:text-red-400"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
