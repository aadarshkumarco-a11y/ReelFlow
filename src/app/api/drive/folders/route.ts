import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { validateFolder } from '@/lib/google-drive'

export async function GET(request: Request) {
  try {
    const userData = await getAuthUser(request)
    if (!userData) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const folders = await db.driveFolder.findMany({
      where: { userId: userData.userId },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ folders })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const userData = await getAuthUser(request)
    if (!userData) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { folderId, accessToken } = await request.json()
    if (!folderId || !accessToken) {
      return NextResponse.json({ error: 'Folder ID and access token required' }, { status: 400 })
    }
    const validation = await validateFolder(folderId, accessToken)
    const folder = await db.driveFolder.create({
      data: {
        userId: userData.userId,
        folderId,
        folderUrl: `https://drive.google.com/drive/folders/${folderId}`,
        label: validation.name,
        videoCount: validation.fileCount,
      },
    })
    await db.log.create({
      data: { userId: userData.userId, level: 'info', message: `Connected Drive folder: ${validation.name} (${validation.fileCount} videos)` },
    })
    return NextResponse.json({ folder })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
