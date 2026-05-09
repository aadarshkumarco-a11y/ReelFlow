const FB_APP_ID = process.env.FB_APP_ID || ''
const FB_APP_SECRET = process.env.FB_APP_SECRET || ''
const FB_GRAPH_VERSION = process.env.FB_GRAPH_VERSION || 'v21.0'
const GRAPH_BASE = `https://graph.facebook.com/${FB_GRAPH_VERSION}`

interface TokenExchangeResult {
  access_token: string
  token_type: string
  expires_in: number
}

export async function exchangeForLongLivedToken(shortLivedToken: string): Promise<TokenExchangeResult> {
  const res = await fetch(
    `${GRAPH_BASE}/oauth/access_token?grant_type=fb_exchange_token&client_id=${FB_APP_ID}&client_secret=${FB_APP_SECRET}&fb_exchange_token=${shortLivedToken}`
  )
  return res.json()
}

export async function getPageAccessToken(pageId: string, userAccessToken: string): Promise<{ access_token: string; name: string }> {
  const res = await fetch(
    `${GRAPH_BASE}/${pageId}?fields=access_token,name&access_token=${userAccessToken}`
  )
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return { access_token: data.access_token, name: data.name }
}

export async function getPageInstagramAccount(pageId: string, pageAccessToken: string): Promise<{ ig_user_id: string; username: string }> {
  const res = await fetch(
    `${GRAPH_BASE}/${pageId}?fields=instagram_business_account{id,username}&access_token=${pageAccessToken}`
  )
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  if (!data.instagram_business_account) throw new Error('No Instagram account linked to this page')
  return { ig_user_id: data.instagram_business_account.id, username: data.instagram_business_account.username }
}

export async function getDirectPageInstagramAccount(pageId: string, pageAccessToken: string): Promise<{ ig_user_id: string; username: string }> {
  const res = await fetch(
    `${GRAPH_BASE}/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`
  )
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  if (!data.instagram_business_account) throw new Error('No Instagram account linked to this page')
  return { ig_user_id: data.instagram_business_account.id, username: 'connected' }
}

export async function initiateReelUpload(igUserId: string, videoUrl: string, accessToken: string, caption: string = ''): Promise<string> {
  const res = await fetch(`${GRAPH_BASE}/${igUserId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      media_type: 'REELS',
      video_url: videoUrl,
      caption: caption,
      share_to_feed: true,
      access_token: accessToken,
    }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.id // container ID
}

export async function checkUploadStatus(containerId: string, accessToken: string): Promise<{ status_code: string; status: string; message?: string }> {
  const res = await fetch(
    `${GRAPH_BASE}/${containerId}?fields=status_code,status&access_token=${accessToken}`
  )
  const data = await res.json()
  if (data.error) {
    return { status_code: 'API_ERROR', status: 'ERROR', message: data.error.message }
  }
  if (!data.status_code) {
    return { status_code: 'UNKNOWN', status: 'IN_PROGRESS', message: 'No status_code returned from Instagram' }
  }
  // Handle all Instagram status codes
  if (data.status_code === 'FINISHED') {
    return { status_code: 'FINISHED', status: 'FINISHED' }
  }
  if (data.status_code === 'ERROR') {
    return { status_code: 'ERROR', status: 'ERROR', message: data.status || 'Instagram upload failed' }
  }
  if (data.status_code === 'IN_PROGRESS') {
    return { status_code: 'IN_PROGRESS', status: 'IN_PROGRESS' }
  }
  if (data.status_code === 'EXPIRED') {
    return { status_code: 'EXPIRED', status: 'ERROR', message: 'Upload expired — video was not processed in time' }
  }
  // Any other unexpected code
  return { status_code: data.status_code, status: 'IN_PROGRESS', message: `Instagram returned: ${data.status_code}` }
}

export async function publishReel(containerId: string, igUserId: string, accessToken: string): Promise<string> {
  const res = await fetch(`${GRAPH_BASE}/${igUserId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creation_id: containerId,
      access_token: accessToken,
    }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.id // published media ID
}

export async function refreshPageToken(pageId: string, pageAccessToken: string): Promise<{ access_token: string; expires_in: number }> {
  const res = await fetch(
    `${GRAPH_BASE}/oauth/access_token?grant_type=fb_exchange_token&client_id=${FB_APP_ID}&client_secret=${FB_APP_SECRET}&fb_exchange_token=${pageAccessToken}`
  )
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return { access_token: data.access_token, expires_in: data.expires_in }
}
