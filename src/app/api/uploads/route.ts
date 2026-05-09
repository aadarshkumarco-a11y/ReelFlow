import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const userData = await getAuthUser(request)
    if (!userData) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const uploads = await db.upload.findMany({
      where: { userId: userData.userId },
      include: { igAccount: { select: { username: true } }, driveFolder: { select: { label: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    return NextResponse.json({ uploads })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
