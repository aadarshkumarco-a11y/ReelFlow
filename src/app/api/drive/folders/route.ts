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
      return NextResponse.json({ error: 'Folder ID aur Google Access Token dono daal do' }, { status: 400 })
    }

    // Auto-extract folder ID from full Google Drive URL
    // e.g., "https://drive.google.com/drive/folders/1aBcDeFg" → "1aBcDeFg"
    let cleanFolderId = folderId.trim()
    if (cleanFolderId.includes('drive.google.com')) {
      const match = cleanFolderId.match(/\/folders\/([a-zA-Z0-9_-]+)/)
      if (match) {
        cleanFolderId = match[1]
      } else {
        return NextResponse.json({ error: 'Google Drive URL se folder ID extract nahi ho paya. Sirf folder ID daalo (e.g., 1aBcDeFgHiJkLmNoPqRsT)' }, { status: 400 })
      }
    }

    // Basic folder ID format check (Google Drive IDs are ~20-30 chars alphanumeric)
    if (cleanFolderId.length < 10 || !/^[a-zA-Z0-9_-]+$/.test(cleanFolderId)) {
      return NextResponse.json({ error: 'Folder ID lagatar galat lag rahi hai. Google Drive folder open karo, URL se ID copy karo — last part after /folders/' }, { status: 400 })
    }

    const validation = await validateFolder(cleanFolderId, accessToken)
    const folder = await db.driveFolder.create({
      data: {
        userId: userData.userId,
        folderId: cleanFolderId,
        folderUrl: `https://drive.google.com/drive/folders/${cleanFolderId}`,
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
