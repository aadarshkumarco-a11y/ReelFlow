import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { getFolderVideos } from '@/lib/google-drive'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userData = await getAuthUser(request)
    if (!userData) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const pageToken = searchParams.get('pageToken') || undefined
    const accessToken = searchParams.get('accessToken')
    if (!accessToken) return NextResponse.json({ error: 'Google access token required' }, { status: 400 })
    const folder = await db.driveFolder.findFirst({ where: { id, userId: userData.userId } })
    if (!folder) return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    const videos = await getFolderVideos(folder.folderId, accessToken, pageToken)
    return NextResponse.json(videos)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
