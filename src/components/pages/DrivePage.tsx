'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { apiFetch } from '@/lib/api'
import {
  FolderOpen, Plus, Trash2, ChevronDown, ChevronRight,
  Video, ExternalLink, Loader2, Film
} from 'lucide-react'

interface DriveFolder {
  id: string
  folderId: string
  folderUrl: string
  label: string
  videoCount: number
  createdAt: string
}

interface DriveVideo {
  id: string
  name: string
  size: string
  createdTime: string
  webViewLink: string
}

export default function DrivePage() {
  const [folders, setFolders] = useState<DriveFolder[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [folderId, setFolderId] = useState('')
  const [accessToken, setAccessToken] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [videos, setVideos] = useState<DriveVideo[]>([])
  const [loadingVideos, setLoadingVideos] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadFolders()
  }, [])

  const loadFolders = async () => {
    try {
      const data = await apiFetch('/api/drive/folders')
      setFolders(data.folders)
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleAddFolder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!folderId || !accessToken) {
      toast({ title: 'Error', description: 'Folder ID aur Google Access Token dono daal do', variant: 'destructive' })
      return
    }
    setAdding(true)
    try {
      const data = await apiFetch('/api/drive/folders', {
        method: 'POST',
        body: JSON.stringify({ folderId, accessToken }),
      })
      toast({ title: 'Folder Connected!', description: `${data.folder.label} — ${data.folder.videoCount} videos mile` })
      setFolderId('')
      setAccessToken('')
      loadFolders()
    } catch (err: any) {
      toast({ title: 'Failed', description: err.message, variant: 'destructive' })
    } finally {
      setAdding(false)
    }
  }

  const handleRemoveFolder = async (id: string, label: string) => {
    try {
      await apiFetch(`/api/drive/folders/${id}`, { method: 'DELETE' })
      toast({ title: 'Removed', description: `${label} hata diya gaya` })
      setFolders(folders.filter((f) => f.id !== id))
      if (expandedId === id) setExpandedId(null)
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    }
  }

  const loadVideos = async (folder: DriveFolder) => {
    if (expandedId === folder.id) {
      setExpandedId(null)
      return
    }
    setExpandedId(folder.id)
    setLoadingVideos(true)
    try {
      const data = await apiFetch(`/api/drive/folders/${folder.id}/videos?accessToken=${accessToken || ''}`)
      setVideos(data.files || [])
    } catch (err: any) {
      toast({ title: 'Error loading videos', description: 'Google Access Token chahiye videos dekhne ke liye', variant: 'destructive' })
      setVideos([])
    } finally {
      setLoadingVideos(false)
    }
  }

  const formatSize = (size: string) => {
    if (!size) return 'N/A'
    const bytes = parseInt(size)
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
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
        <h1 className="text-3xl font-bold text-white">Google Drive</h1>
        <p className="text-zinc-400 mt-1">Apne video folders connect karo Google Drive se</p>
      </div>

      {/* Add Folder Form */}
      <Card className="border-zinc-800 bg-zinc-900/60">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-violet-400" />
            Add Drive Folder
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Google Drive folder ID aur apna Google Access Token daalo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddFolder} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="folder-id" className="text-zinc-300">Drive Folder ID</Label>
              <div className="relative">
                <FolderOpen className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                <Input
                  id="folder-id"
                  type="text"
                  placeholder="1aBcDeFgHiJkLmNoPqRsT..."
                  value={folderId}
                  onChange={(e) => setFolderId(e.target.value)}
                  className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="g-token" className="text-zinc-300">Google Access Token</Label>
              <div className="relative">
                <Film className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                <Input
                  id="g-token"
                  type="text"
                  placeholder="ya29.a0AfH6SMBxxxx..."
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={adding}
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white"
            >
              {adding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FolderOpen className="w-4 h-4 mr-2" />}
              {adding ? 'Connecting...' : 'Connect Folder'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Connected Folders */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Connected Folders</h2>
        {folders.length === 0 ? (
          <Card className="border-zinc-800 bg-zinc-900/60">
            <CardContent className="py-8 text-center text-zinc-500">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Koi folder connected nahi hai</p>
              <p className="text-sm mt-1">Upar form se naya folder connect karo</p>
            </CardContent>
          </Card>
        ) : (
          folders.map((folder) => (
            <Card key={folder.id} className="border-zinc-800 bg-zinc-900/60 hover:border-violet-500/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => loadVideos(folder)}
                    className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  >
                    {expandedId === folder.id ? (
                      <ChevronDown className="w-5 h-5 text-violet-400 shrink-0" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-zinc-500 shrink-0" />
                    )}
                    <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
                      <FolderOpen className="w-5 h-5 text-violet-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-medium truncate">{folder.label}</span>
                        <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30">
                          {folder.videoCount} videos
                        </Badge>
                      </div>
                      <p className="text-zinc-500 text-sm truncate">{folder.folderUrl}</p>
                    </div>
                  </button>
                  <div className="flex gap-2 shrink-0 ml-2">
                    <a href={folder.folderUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </a>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveFolder(folder.id, folder.label)}
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Expanded Videos */}
                {expandedId === folder.id && (
                  <div className="mt-4 ml-8 border-t border-zinc-800 pt-4">
                    {loadingVideos ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
                      </div>
                    ) : videos.length === 0 ? (
                      <p className="text-zinc-500 text-sm py-2">Koi video nahi mili is folder mein</p>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                        {videos.map((video) => (
                          <div
                            key={video.id}
                            className="flex items-center gap-3 p-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                          >
                            <div className="w-8 h-8 rounded bg-fuchsia-500/20 flex items-center justify-center shrink-0">
                              <Video className="w-4 h-4 text-fuchsia-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm truncate">{video.name}</p>
                              <p className="text-zinc-500 text-xs">{formatSize(video.size)} • {formatDate(video.createdTime)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
