import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { checkUploadStatus, publishReel } from '@/lib/instagram'

// POST /api/instagram/publish/check — Checks status once, publishes if ready
export async function POST(request: Request) {
  let uploadId: string | undefined
  try {
    const userData = await getAuthUser(request)
    if (!userData) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    uploadId = body.uploadId
    if (!uploadId) return NextResponse.json({ error: 'Upload ID required' }, { status: 400 })

    const upload = await db.upload.findFirst({ where: { id: uploadId, userId: userData.userId } })
    if (!upload) return NextResponse.json({ error: 'Upload not found' }, { status: 404 })

    // Already in terminal state — return immediately
    if (upload.status === 'completed') {
      return NextResponse.json({ status: 'completed', instagramMediaId: upload.instagramMediaId })
    }
    if (upload.status === 'failed') {
      return NextResponse.json({ status: 'failed', errorMessage: upload.errorMessage, containerId: upload.containerId })
    }
    if (!upload.containerId) {
      return NextResponse.json({ status: 'pending', message: 'No container ID found — upload may have failed at initiation' })
    }

    const account = await db.instagramAccount.findUnique({ where: { id: upload.igAccountId } })
    if (!account) return NextResponse.json({ error: 'Instagram account not found' }, { status: 404 })

    const checkResult = await checkUploadStatus(upload.containerId, account.accessToken)

    if (checkResult.status === 'FINISHED') {
      // Container ready — publish the reel
      const mediaId = await publishReel(upload.containerId, account.igUserId, account.accessToken)
      await db.upload.update({
        where: { id: upload.id },
        data: { status: 'completed', instagramMediaId: mediaId, completedAt: new Date() },
      })
      await db.log.create({
        data: { userId: userData.userId, level: 'success', message: `Reel published successfully: ${mediaId}` },
      })
      return NextResponse.json({ status: 'completed', instagramMediaId: mediaId })
    }

    if (checkResult.status === 'ERROR') {
      // Instagram returned an error — mark upload as failed with details
      const errorMsg = checkResult.message || `Instagram error: ${checkResult.status_code}`
      await db.upload.update({
        where: { id: upload.id },
        data: { status: 'failed', errorMessage: errorMsg },
      })
      await db.log.create({
        data: { userId: userData.userId, level: 'error', message: `Reel upload failed: ${errorMsg}`, metadata: JSON.stringify({ containerId: upload.containerId, igStatusCode: checkResult.status_code }) },
      })
      return NextResponse.json({ status: 'failed', errorMessage: errorMsg })
    }

    // Still IN_PROGRESS or UNKNOWN — continue polling
    return NextResponse.json({ status: 'processing', igStatusCode: checkResult.status_code, message: checkResult.message })
  } catch (error: any) {
    // Log the error to DB so user can see it in logs page
    if (uploadId) {
      await db.upload.update({
        where: { id: uploadId },
        data: { status: 'failed', errorMessage: error.message },
      }).catch(() => {})
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
