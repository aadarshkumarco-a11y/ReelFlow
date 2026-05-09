import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const userData = await getAuthUser(request)
    if (!userData) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    let settings = await db.settings.findUnique({ where: { userId: userData.userId } })
    if (!settings) {
      settings = await db.settings.create({ data: { userId: userData.userId } })
    }
    return NextResponse.json({ settings })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const userData = await getAuthUser(request)
    if (!userData) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { defaultCaption, maxRetries, autoRetryEnabled, theme } = await request.json()
    const settings = await db.settings.upsert({
      where: { userId: userData.userId },
      update: {
        ...(defaultCaption !== undefined && { defaultCaption }),
        ...(maxRetries !== undefined && { maxRetries }),
        ...(autoRetryEnabled !== undefined && { autoRetryEnabled }),
        ...(theme !== undefined && { theme }),
      },
      create: {
        userId: userData.userId,
        defaultCaption: defaultCaption || '',
        maxRetries: maxRetries || 3,
        autoRetryEnabled: autoRetryEnabled ?? true,
        theme: theme || 'dark',
      },
    })
    return NextResponse.json({ settings })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
