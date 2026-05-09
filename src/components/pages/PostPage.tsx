'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { apiFetch } from '@/lib/api'
import { useAppStore } from '@/lib/store'
import {
  Upload, Send, CheckCircle2, XCircle, Loader2,
  Instagram, FolderOpen, Video, FileText
} from 'lucide-react'

interface IgAccount {
  id: string
  username: string
}

interface DriveFolder {
  id: string
  folderId: string
  label: string
  videoCount: number
}

interface DriveVideo {
  id: string
  name: string
  size: string
  webViewLink: string
  webContentLink?: string
}

export default function PostPage() {
  const { user } = useAppStore()
  const { toast } = useToast()

  const [accounts, setAccounts] = useState<IgAccount[]>([])
  const [folders, setFolders] = useState<DriveFolder[]>([])
  const [videos, setVideos] = useState<DriveVideo[]>([])
  const [selectedAccount, setSelectedAccount] = useState('')
  const [selectedFolder, setSelectedFolder] = useState('')
  const [selectedVideo, setSelectedVideo] = useState<DriveVideo | null>(null)
  const [caption, setCaption] = useState('')
  const [googleToken, setGoogleToken] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [pollingStatus, setPollingStatus] = useState<string | null>(null)
  const [uploadId, setUploadId] = useState<string | null>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    loadData()
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  const loadData = async () => {
    try {
      const [accData, foldData] = await Promise.all([
        apiFetch('/api/instagram/accounts'),
        apiFetch('/api/drive/folders'),
      ])
      setAccounts(accData.accounts)
      setFolders(foldData.folders)
    } catch (err: any) {
      console.error('Failed to load data:', err)
    }
  }

  const loadVideos = useCallback(async (folderId: string) => {
    if (!folderId || !googleToken) {
      toast({ title: 'Google Token Required', description: 'Google Access Token daalna zaroori hai videos load karne ke liye', variant: 'destructive' })
      return
    }
    try {
      const data = await apiFetch(`/api/drive/folders/${folderId}/videos?accessToken=${googleToken}`)
      setVideos(data.files || [])
      setSelectedVideo(null)
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    }
  }, [googleToken, toast])

  useEffect(() => {
    if (selectedFolder) {
      loadVideos(selectedFolder)
    } else {
      setVideos([])
      setSelectedVideo(null)
    }
  }, [selectedFolder, loadVideos])

  const startPolling = (uId: string) => {
    setUploadId(uId)
    setPollingStatus('processing')

    pollRef.current = setInterval(async () => {
      try {
        const data = await apiFetch('/api/instagram/publish/check', {
          method: 'POST',
          body: JSON.stringify({ uploadId: uId }),
        })

        if (data.status === 'completed') {
          setPollingStatus('completed')
          if (pollRef.current) clearInterval(pollRef.current)
          toast({ title: 'Reel Published! 🎉', description: `Instagram Media ID: ${data.instagramMediaId}` })
        } else if (data.status === 'failed') {
          setPollingStatus('failed')
          if (pollRef.current) clearInterval(pollRef.current)
          toast({ title: 'Publish Failed', description: data.errorMessage || 'Kuch gadbad ho gayi', variant: 'destructive' })
        }
        // Still processing — continue polling
      } catch (err: any) {
        setPollingStatus('failed')
        if (pollRef.current) clearInterval(pollRef.current)
        toast({ title: 'Error', description: err.message, variant: 'destructive' })
      }
    }, 10000) // Poll every 10 seconds
  }

  const handlePublish = async () => {
    if (!selectedAccount) {
      toast({ title: 'Error', description: 'Instagram account select karo pehle', variant: 'destructive' })
      return
    }
    if (!selectedVideo) {
      toast({ title: 'Error', description: 'Video select karo pehle', variant: 'destructive' })
      return
    }

    setPublishing(true)
    try {
      // Get the download URL for the video
      let videoUrl = selectedVideo.webContentLink || selectedVideo.webViewLink
      if (!videoUrl) {
        videoUrl = `https://drive.google.com/uc?export=download&id=${selectedVideo.id}`
      }

      const data = await apiFetch('/api/instagram/publish', {
        method: 'POST',
        body: JSON.stringify({
          igAccountId: selectedAccount,
          videoUrl,
          caption,
        }),
      })

      toast({ title: 'Upload Started!', description: 'Reel processing ho rahi hai Instagram pe...' })
      startPolling(data.uploadId)
    } catch (err: any) {
      toast({ title: 'Publish failed', description: err.message, variant: 'destructive' })
    } finally {
      setPublishing(false)
    }
  }

  const resetForm = () => {
    setPublishing(false)
    setPollingStatus(null)
    setUploadId(null)
    setSelectedVideo(null)
    setCaption('')
    if (pollRef.current) clearInterval(pollRef.current)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Post Reel</h1>
        <p className="text-zinc-400 mt-1">Instagram Reel publish karo apne Google Drive videos se</p>
      </div>

      {/* Polling Status Banner */}
      {pollingStatus && (
        <Card className={`border-2 ${
          pollingStatus === 'completed' ? 'border-emerald-500/50 bg-emerald-500/10' :
          pollingStatus === 'failed' ? 'border-red-500/50 bg-red-500/10' :
          'border-amber-500/50 bg-amber-500/10'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {pollingStatus === 'completed' ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                ) : pollingStatus === 'failed' ? (
                  <XCircle className="w-6 h-6 text-red-400" />
                ) : (
                  <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
                )}
                <div>
                  <p className="font-medium text-white">
                    {pollingStatus === 'completed' ? 'Reel Published Successfully! 🎉' :
                     pollingStatus === 'failed' ? 'Publish Failed' :
                     'Reel is being processed...'}
                  </p>
                  <p className="text-sm text-zinc-400">
                    {pollingStatus === 'processing' ? 'Har 10 second mein check ho raha hai status' : `Upload ID: ${uploadId}`}
                  </p>
                </div>
              </div>
              {(pollingStatus === 'completed' || pollingStatus === 'failed') && (
                <Button onClick={resetForm} variant="outline" className="border-zinc-600 text-zinc-300">
                  Post Another Reel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column — Selection */}
        <div className="space-y-4">
          {/* Google Token */}
          <Card className="border-zinc-800 bg-zinc-900/60">
            <CardHeader>
              <CardTitle className="text-white text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-violet-400" />
                Google Access Token
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="text"
                placeholder="ya29.a0AfH6SMBxxxx..."
                value={googleToken}
                onChange={(e) => setGoogleToken(e.target.value)}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
              <p className="text-zinc-500 text-xs mt-2">Videos load karne ke liye zaroori hai</p>
            </CardContent>
          </Card>

          {/* Instagram Account */}
          <Card className="border-zinc-800 bg-zinc-900/60">
            <CardHeader>
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Instagram className="w-4 h-4 text-violet-400" />
                Instagram Account
              </CardTitle>
            </CardHeader>
            <CardContent>
              {accounts.length === 0 ? (
                <p className="text-zinc-500 text-sm">Pehle Instagram page se account connect karo</p>
              ) : (
                <div className="space-y-2">
                  {accounts.map((acc) => (
                    <button
                      key={acc.id}
                      onClick={() => setSelectedAccount(acc.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        selectedAccount === acc.id
                          ? 'bg-violet-500/20 border border-violet-500/50'
                          : 'bg-zinc-800/50 border border-transparent hover:bg-zinc-800'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                        <Instagram className="w-4 h-4 text-white" />
                      </div>
                      <span className={`font-medium ${selectedAccount === acc.id ? 'text-violet-300' : 'text-zinc-300'}`}>
                        @{acc.username}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Drive Folder */}
          <Card className="border-zinc-800 bg-zinc-900/60">
            <CardHeader>
              <CardTitle className="text-white text-base flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-violet-400" />
                Drive Folder
              </CardTitle>
            </CardHeader>
            <CardContent>
              {folders.length === 0 ? (
                <p className="text-zinc-500 text-sm">Pehle Google Drive se folder connect karo</p>
              ) : (
                <div className="space-y-2">
                  {folders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => setSelectedFolder(folder.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        selectedFolder === folder.id
                          ? 'bg-violet-500/20 border border-violet-500/50'
                          : 'bg-zinc-800/50 border border-transparent hover:bg-zinc-800'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                        <FolderOpen className="w-4 h-4 text-violet-400" />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <span className={`font-medium block truncate ${selectedFolder === folder.id ? 'text-violet-300' : 'text-zinc-300'}`}>
                          {folder.label}
                        </span>
                        <span className="text-zinc-500 text-xs">{folder.videoCount} videos</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column — Video & Caption */}
        <div className="space-y-4">
          {/* Video Selection */}
          <Card className="border-zinc-800 bg-zinc-900/60">
            <CardHeader>
              <CardTitle className="text-white text-base flex items-center gap-2">
                <Video className="w-4 h-4 text-violet-400" />
                Select Video
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedFolder ? (
                <p className="text-zinc-500 text-sm">Pehle ek folder select karo</p>
              ) : videos.length === 0 ? (
                <p className="text-zinc-500 text-sm">Is folder mein koi video nahi mili</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {videos.map((video) => (
                    <button
                      key={video.id}
                      onClick={() => setSelectedVideo(video)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        selectedVideo?.id === video.id
                          ? 'bg-fuchsia-500/20 border border-fuchsia-500/50'
                          : 'bg-zinc-800/50 border border-transparent hover:bg-zinc-800'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-fuchsia-500/20 flex items-center justify-center shrink-0">
                        <Video className="w-4 h-4 text-fuchsia-400" />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <span className={`text-sm block truncate ${selectedVideo?.id === video.id ? 'text-fuchsia-300' : 'text-zinc-300'}`}>
                          {video.name}
                        </span>
                        <span className="text-zinc-500 text-xs">
                          {video.size ? `${(parseInt(video.size) / (1024 * 1024)).toFixed(1)} MB` : ''}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Caption */}
          <Card className="border-zinc-800 bg-zinc-900/60">
            <CardHeader>
              <CardTitle className="text-white text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-violet-400" />
                Caption
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Apna reel caption likho... #hashtags @mentions"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={4}
                className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 resize-none"
              />
              <p className="text-zinc-500 text-xs mt-2">{caption.length} characters</p>
            </CardContent>
          </Card>

          {/* Publish Button */}
          <Button
            onClick={handlePublish}
            disabled={publishing || pollingStatus === 'processing'}
            className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-medium py-6 text-lg"
          >
            {publishing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Starting Upload...
              </>
            ) : pollingStatus === 'processing' ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Publish Reel
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
