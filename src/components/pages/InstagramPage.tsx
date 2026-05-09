'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { apiFetch } from '@/lib/api'
import { Instagram, Plus, Trash2, RefreshCw, Link, ShieldCheck, Loader2 } from 'lucide-react'

interface IgAccount {
  id: string
  igUserId: string
  username: string
  pageId: string
  tokenExpiresAt: string
  createdAt: string
}

export default function InstagramPage() {
  const [accounts, setAccounts] = useState<IgAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [userToken, setUserToken] = useState('')
  const [pageId, setPageId] = useState('')
  const [refreshingId, setRefreshingId] = useState<string | null>(null)
  const { toast } = useToast()

  const loadAccounts = async () => {
    try {
      const data = await apiFetch('/api/instagram/accounts')
      setAccounts(data.accounts)
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAccounts()
  }, [])

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userToken || !pageId) {
      toast({ title: 'Error', description: 'Dono fields bhar lo — User Access Token aur Page ID', variant: 'destructive' })
      return
    }
    setConnecting(true)
    try {
      const data = await apiFetch('/api/instagram/accounts', {
        method: 'POST',
        body: JSON.stringify({ userAccessToken: userToken, pageId }),
      })
      toast({ title: 'Connected!', description: data.message || `Instagram account @${data.account.username} connected successfully` })
      setUserToken('')
      setPageId('')
      loadAccounts()
    } catch (err: any) {
      toast({ title: 'Connection failed', description: err.message, variant: 'destructive' })
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnect = async (id: string, username: string) => {
    try {
      await apiFetch(`/api/instagram/accounts/${id}`, { method: 'DELETE' })
      toast({ title: 'Disconnected', description: `@${username} hata diya gaya` })
      setAccounts(accounts.filter((a) => a.id !== id))
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    }
  }

  const handleRefresh = async (id: string) => {
    setRefreshingId(id)
    try {
      await apiFetch(`/api/instagram/accounts/${id}`, { method: 'POST' })
      toast({ title: 'Token Refreshed', description: 'Access token naya ho gaya hai!' })
      loadAccounts()
    } catch (err: any) {
      toast({ title: 'Refresh failed', description: err.message, variant: 'destructive' })
    } finally {
      setRefreshingId(null)
    }
  }

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date()
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
        <h1 className="text-3xl font-bold text-white">Instagram Accounts</h1>
        <p className="text-zinc-400 mt-1">Apne Instagram Business accounts connect karo</p>
      </div>

      {/* Connect Form */}
      <Card className="border-zinc-800 bg-zinc-900/60">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-violet-400" />
            Connect New Account
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Facebook User Access Token aur Page ID chahiye account connect karne ke liye
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleConnect} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-token" className="text-zinc-300">User Access Token</Label>
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                <Input
                  id="user-token"
                  type="text"
                  placeholder="EAAxxxxxx..."
                  value={userToken}
                  onChange={(e) => setUserToken(e.target.value)}
                  className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="page-id" className="text-zinc-300">Facebook Page ID</Label>
              <div className="relative">
                <Link className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                <Input
                  id="page-id"
                  type="text"
                  placeholder="1045781891961754"
                  value={pageId}
                  onChange={(e) => setPageId(e.target.value)}
                  className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={connecting}
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white"
            >
              {connecting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Instagram className="w-4 h-4 mr-2" />}
              {connecting ? 'Connecting...' : 'Connect Account'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Connected Accounts */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Connected Accounts</h2>
        {accounts.length === 0 ? (
          <Card className="border-zinc-800 bg-zinc-900/60">
            <CardContent className="py-8 text-center text-zinc-500">
              <Instagram className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Koi account connected nahi hai</p>
              <p className="text-sm mt-1">Upar form se naya account connect karo</p>
            </CardContent>
          </Card>
        ) : (
          accounts.map((account) => (
            <Card key={account.id} className="border-zinc-800 bg-zinc-900/60 hover:border-violet-500/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                      <Instagram className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">@{account.username}</span>
                        {isExpired(account.tokenExpiresAt) ? (
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Token Expired</Badge>
                        ) : (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Active</Badge>
                        )}
                      </div>
                      <p className="text-zinc-500 text-sm">Page ID: {account.pageId}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRefresh(account.id)}
                      disabled={refreshingId === account.id}
                      className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    >
                      {refreshingId === account.id ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-1" />
                      )}
                      Refresh Token
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnect(account.id, account.username)}
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
