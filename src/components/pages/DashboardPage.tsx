'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { apiFetch } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import { Film, CheckCircle2, XCircle, Loader2, TrendingUp, Clock } from 'lucide-react'

interface Stats {
  total: number
  completed: number
  failed: number
  processing: number
}

interface Upload {
  id: string
  videoFileName: string
  caption: string
  status: string
  createdAt: string
  completedAt: string | null
  igAccount: { username: string }
}

export default function DashboardPage() {
  const { user } = useAppStore()
  const [stats, setStats] = useState<Stats | null>(null)
  const [uploads, setUploads] = useState<Upload[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const [statsData, uploadsData] = await Promise.all([
        apiFetch('/api/uploads/stats'),
        apiFetch('/api/uploads?limit=10'),
      ])
      setStats(statsData)
      setUploads(uploadsData.uploads)
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Completed</Badge>
      case 'failed':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Failed</Badge>
      case 'processing':
      case 'uploading':
        return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Processing</Badge>
      default:
        return <Badge className="bg-zinc-500/20 text-zinc-400 border-zinc-500/30">Pending</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl font-bold text-white">
          Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">{user?.name}</span> 👋
        </h1>
        <p className="text-zinc-400 mt-1">Here&apos;s your ReelFlow dashboard overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-zinc-800 bg-zinc-900/60 hover:border-violet-500/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Total Reels</p>
                <p className="text-3xl font-bold text-white mt-1">{stats?.total || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                <Film className="w-6 h-6 text-violet-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/60 hover:border-emerald-500/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Completed</p>
                <p className="text-3xl font-bold text-emerald-400 mt-1">{stats?.completed || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/60 hover:border-red-500/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Failed</p>
                <p className="text-3xl font-bold text-red-400 mt-1">{stats?.failed || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/60 hover:border-amber-500/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-400 text-sm">Processing</p>
                <p className="text-3xl font-bold text-amber-400 mt-1">{stats?.processing || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Uploads */}
      <Card className="border-zinc-800 bg-zinc-900/60">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-violet-400" />
            Recent Uploads
          </CardTitle>
        </CardHeader>
        <CardContent>
          {uploads.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Koi reels upload nahi hui abhi tak</p>
              <p className="text-sm mt-1">Go to &quot;Post Reel&quot; to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {uploads.map((upload) => (
                <div
                  key={upload.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-medium truncate">@{upload.igAccount?.username}</span>
                      {statusBadge(upload.status)}
                    </div>
                    <p className="text-zinc-400 text-sm truncate">
                      {upload.caption || upload.videoFileName}
                    </p>
                  </div>
                  <span className="text-zinc-500 text-xs whitespace-nowrap">
                    {formatDate(upload.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
