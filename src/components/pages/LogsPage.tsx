'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { apiFetch } from '@/lib/api'
import { ScrollText, Info, CheckCircle2, AlertTriangle, XCircle, Loader2 } from 'lucide-react'

interface LogEntry {
  id: string
  level: string
  message: string
  createdAt: string
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)

  const loadLogs = async () => {
    try {
      const data = await apiFetch('/api/logs?limit=200')
      setLogs(data.logs)
    } catch (err) {
      console.error('Failed to load logs:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [])

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'success':
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            success
          </Badge>
        )
      case 'error':
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <XCircle className="w-3 h-3 mr-1" />
            error
          </Badge>
        )
      case 'warning':
        return (
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
            <AlertTriangle className="w-3 h-3 mr-1" />
            warning
          </Badge>
        )
      default:
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            <Info className="w-3 h-3 mr-1" />
            info
          </Badge>
        )
    }
  }

  const formatTimestamp = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
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
      <div>
        <h1 className="text-3xl font-bold text-white">Activity Logs</h1>
        <p className="text-zinc-400 mt-1">Saari activities ka record yahan dikhta hai</p>
      </div>

      <Card className="border-zinc-800 bg-zinc-900/60">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-violet-400" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <ScrollText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Abhi tak koi activity nahi hai</p>
              <p className="text-sm mt-1">Jab bhi kuch karo — reels upload, account connect etc — yahan dikhega</p>
            </div>
          ) : (
            <ScrollArea className="max-h-[600px]">
              <div className="space-y-2 pr-4">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                  >
                    <div className="shrink-0 mt-0.5">
                      {getLevelBadge(log.level)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-zinc-200 text-sm">{log.message}</p>
                      <p className="text-zinc-500 text-xs mt-1">{formatTimestamp(log.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
