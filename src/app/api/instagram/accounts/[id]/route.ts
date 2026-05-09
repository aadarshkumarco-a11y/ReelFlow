import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { refreshPageToken } from '@/lib/instagram'

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userData = await getAuthUser(request)
    if (!userData) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const account = await db.instagramAccount.findFirst({ where: { id, userId: userData.userId } })
    if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    await db.instagramAccount.delete({ where: { id } })
    await db.log.create({
      data: { userId: userData.userId, level: 'info', message: `Disconnected Instagram account: @${account.username}` },
    })
    return NextResponse.json({ message: 'Account disconnected' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userData = await getAuthUser(request)
    if (!userData) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const account = await db.instagramAccount.findFirst({ where: { id, userId: userData.userId } })
    if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    const refreshed = await refreshPageToken(account.pageId, account.accessToken)
    await db.instagramAccount.update({
      where: { id },
      data: {
        accessToken: refreshed.access_token,
        tokenExpiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
      },
    })
    await db.log.create({
      data: { userId: userData.userId, level: 'info', message: `Refreshed token for @${account.username}` },
    })
    return NextResponse.json({ message: 'Token refreshed', expiresIn: refreshed.expires_in })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
