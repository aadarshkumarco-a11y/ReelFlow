import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { initiateReelUpload } from '@/lib/instagram'

// POST /api/instagram/publish — Initiates upload, returns immediately
export async function POST(request: Request) {
  try {
    const userData = await getAuthUser(request)
    if (!userData) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { igAccountId, videoUrl, caption } = await request.json()
    if (!igAccountId || !videoUrl) {
      return NextResponse.json({ error: 'Account and video URL required' }, { status: 400 })
    }
    const account = await db.instagramAccount.findFirst({ where: { id: igAccountId, userId: userData.userId } })
    if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

    const upload = await db.upload.create({
      data: {
        userId: userData.userId,
        igAccountId,
        videoUrl,
        caption: caption || '',
        videoFileName: 'reel_upload',
        status: 'uploading',
      },
    })

    const containerId = await initiateReelUpload(account.igUserId, videoUrl, account.accessToken, caption)
    await db.upload.update({
      where: { id: upload.id },
      data: { containerId, status: 'processing' },
    })

    await db.log.create({
      data: { userId: userData.userId, level: 'info', message: `Started reel upload: ${upload.id}`, metadata: JSON.stringify({ containerId }) },
    })

    return NextResponse.json({ uploadId: upload.id, containerId, status: 'processing' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
