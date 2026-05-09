import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { checkUploadStatus, publishReel } from '@/lib/instagram'

// POST /api/instagram/publish/check — Checks status once, publishes if ready
export async function POST(request: Request) {
  try {
    const userData = await getAuthUser(request)
    if (!userData) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { uploadId } = await request.json()
    if (!uploadId) return NextResponse.json({ error: 'Upload ID required' }, { status: 400 })

    const upload = await db.upload.findFirst({ where: { id: uploadId, userId: userData.userId } })
    if (!upload) return NextResponse.json({ error: 'Upload not found' }, { status: 404 })

    if (upload.status === 'completed') return NextResponse.json({ status: 'completed', instagramMediaId: upload.instagramMediaId })
    if (upload.status === 'failed') return NextResponse.json({ status: 'failed', errorMessage: upload.errorMessage })
    if (!upload.containerId) return NextResponse.json({ status: 'pending' })

    const account = await db.instagramAccount.findUnique({ where: { id: upload.igAccountId } })
    if (!account) return NextResponse.json({ error: 'Instagram account not found' }, { status: 404 })

    const checkResult = await checkUploadStatus(upload.containerId, account.accessToken)

    if (checkResult.status === 'FINISHED') {
      const mediaId = await publishReel(upload.containerId, account.igUserId, account.accessToken)
      await db.upload.update({
        where: { id: upload.id },
        data: { status: 'completed', instagramMediaId: mediaId, completedAt: new Date() },
      })
      await db.log.create({
        data: { userId: userData.userId, level: 'success', message: `Reel published: ${mediaId}` },
      })
      return NextResponse.json({ status: 'completed', instagramMediaId: mediaId })
    }

    return NextResponse.json({ status: 'processing' })
  } catch (error: any) {
    await db.upload.update({
      where: { id: uploadId },
      data: { status: 'failed', errorMessage: error.message },
    }).catch(() => {})
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
