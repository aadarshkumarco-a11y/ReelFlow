'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { apiFetch } from '@/lib/api'
import { Settings, Save, Loader2, Type, RotateCw, Palette } from 'lucide-react'

interface UserSettings {
  id: string
  defaultCaption: string
  maxRetries: number
  autoRetryEnabled: boolean
  theme: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const loadSettings = async () => {
    try {
      const data = await apiFetch('/api/settings')
      setSettings(data.settings)
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const handleSave = async () => {
    if (!settings) return
    setSaving(true)
    try {
      await apiFetch('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      })
      toast({ title: 'Settings Saved!', description: 'Settings update ho gayi hai ✅' })
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    )
  }

  if (!settings) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="text-zinc-400 mt-1">Apni preferences customize karo</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Default Caption */}
        <Card className="border-zinc-800 bg-zinc-900/60">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Type className="w-5 h-5 text-violet-400" />
              Default Caption
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Ye caption har reel ke liye default use hoga
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="text"
              placeholder="#trending #viral #reels"
              value={settings.defaultCaption}
              onChange={(e) => setSettings({ ...settings, defaultCaption: e.target.value })}
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
            />
            <p className="text-zinc-500 text-sm">
              {settings.defaultCaption.length} characters — Post Reel page pe isse override kar sakte ho
            </p>
          </CardContent>
        </Card>

        {/* Max Retries */}
        <Card className="border-zinc-800 bg-zinc-900/60">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <RotateCw className="w-5 h-5 text-violet-400" />
              Max Retries
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Failed upload ke kitni baar retry karna hai
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Input
                type="number"
                min={0}
                max={10}
                value={settings.maxRetries}
                onChange={(e) => setSettings({ ...settings, maxRetries: parseInt(e.target.value) || 0 })}
                className="w-24 bg-zinc-800 border-zinc-700 text-white text-center"
              />
              <span className="text-zinc-400 text-sm">baar (0-10)</span>
            </div>
          </CardContent>
        </Card>

        {/* Auto Retry */}
        <Card className="border-zinc-800 bg-zinc-900/60">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <RotateCw className="w-5 h-5 text-violet-400" />
              Auto Retry
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Failed uploads ko automatically retry kare?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-zinc-300">
                {settings.autoRetryEnabled ? 'Enabled — Failed reels automatically retry hongi' : 'Disabled — Manual retry karna padega'}
              </span>
              <Switch
                checked={settings.autoRetryEnabled}
                onCheckedChange={(checked) => setSettings({ ...settings, autoRetryEnabled: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Theme */}
        <Card className="border-zinc-800 bg-zinc-900/60">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Palette className="w-5 h-5 text-violet-400" />
              Theme
            </CardTitle>
            <CardDescription className="text-zinc-400">
              UI theme select karo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {['dark', 'light'].map((theme) => (
                <button
                  key={theme}
                  onClick={() => setSettings({ ...settings, theme })}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                    settings.theme === theme
                      ? theme === 'dark'
                        ? 'border-violet-500 bg-zinc-800'
                        : 'border-violet-500 bg-white/10'
                      : 'border-zinc-700 hover:border-zinc-600'
                  }`}
                >
                  <div className={`w-full h-12 rounded mb-2 ${
                    theme === 'dark' ? 'bg-zinc-950' : 'bg-gray-200'
                  }`} />
                  <span className={`text-sm font-medium capitalize ${
                    settings.theme === theme ? 'text-violet-400' : 'text-zinc-500'
                  }`}>
                    {theme}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white px-8"
        >
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}
