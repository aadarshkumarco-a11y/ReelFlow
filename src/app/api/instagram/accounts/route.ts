import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { getPageAccessToken, getPageInstagramAccount, getDirectPageInstagramAccount } from '@/lib/instagram'

export async function GET(request: Request) {
  try {
    const userData = await getAuthUser(request)
    if (!userData) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const accounts = await db.instagramAccount.findMany({
      where: { userId: userData.userId },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ accounts })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const userData = await getAuthUser(request)
    if (!userData) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { userAccessToken, pageId } = await request.json()
    if (!userAccessToken || !pageId) {
      return NextResponse.json({ error: 'User access token and page ID required' }, { status: 400 })
    }
    const pageData = await getPageAccessToken(pageId, userAccessToken)
    let igData
    try {
      igData = await getPageInstagramAccount(pageId, pageData.access_token)
    } catch {
      igData = await getDirectPageInstagramAccount(pageId, pageData.access_token)
    }
    const existing = await db.instagramAccount.findFirst({
      where: { userId: userData.userId, igUserId: igData.ig_user_id },
    })
    if (existing) {
      await db.instagramAccount.update({
        where: { id: existing.id },
        data: {
          accessToken: pageData.access_token,
          tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          pageId,
          username: igData.username,
        },
      })
      return NextResponse.json({ account: existing, message: 'Account reconnected' })
    }
    const account = await db.instagramAccount.create({
      data: {
        userId: userData.userId,
        igUserId: igData.ig_user_id,
        username: igData.username,
        pageId,
        accessToken: pageData.access_token,
        tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      },
    })
    await db.log.create({
      data: { userId: userData.userId, level: 'info', message: `Connected Instagram account: @${igData.username}` },
    })
    return NextResponse.json({ account })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
