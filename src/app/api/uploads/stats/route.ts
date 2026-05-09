import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const userData = await getAuthUser(request)
    if (!userData) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const [total, completed, failed, processing] = await Promise.all([
      db.upload.count({ where: { userId: userData.userId } }),
      db.upload.count({ where: { userId: userData.userId, status: 'completed' } }),
      db.upload.count({ where: { userId: userData.userId, status: 'failed' } }),
      db.upload.count({ where: { userId: userData.userId, status: { in: ['uploading', 'processing', 'pending'] } } }),
    ])
    return NextResponse.json({ total, completed, failed, processing })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
