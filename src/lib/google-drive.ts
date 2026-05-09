const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ''
const REDIRECT_URI = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

interface GoogleTokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  token_type: string
  scope: string
}

export function getGoogleAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: `${REDIRECT_URI}/api/drive/callback`,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/drive.readonly',
    access_type: 'offline',
    prompt: 'consent',
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export async function exchangeGoogleCode(code: string): Promise<GoogleTokenResponse> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: `${REDIRECT_URI}/api/drive/callback`,
      grant_type: 'authorization_code',
    }),
  })
  return res.json()
}

export async function validateFolder(folderId: string, accessToken: string): Promise<{ name: string; fileCount: number }> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${folderId}?fields=name&access_token=${accessToken}`
  )
  if (!res.ok) throw new Error('Folder not found or access denied')
  const folder = await res.json()

  const countRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents and mimeType contains 'video/'&fields=files(id,name,size,createdTime)&pageSize=100&access_token=${accessToken}`
  )
  const countData = await countRes.json()
  return { name: folder.name, fileCount: countData.files?.length || 0 }
}

export async function getFolderVideos(folderId: string, accessToken: string, pageToken?: string): Promise<{ files: Array<{ id: string; name: string; size: string; createdTime: string; webViewLink: string }>; nextPageToken?: string }> {
  const params = new URLSearchParams({
    q: `'${folderId}' in parents and mimeType contains 'video/'`,
    fields: 'files(id,name,size,createdTime,webViewLink),nextPageToken',
    pageSize: '20',
    orderBy: 'createdTime desc',
    access_token: accessToken,
  })
  if (pageToken) params.set('pageToken', pageToken)

  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`)
  return res.json()
}

export async function getVideoDownloadUrl(fileId: string, accessToken: string): Promise<string> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?fields=webContentLink&access_token=${accessToken}`
  )
  const data = await res.json()
  return data.webContentLink
}
