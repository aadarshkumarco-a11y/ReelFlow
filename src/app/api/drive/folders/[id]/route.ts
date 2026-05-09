import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userData = await getAuthUser(request)
    if (!userData) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const folder = await db.driveFolder.findFirst({ where: { id, userId: userData.userId } })
    if (!folder) return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    await db.driveFolder.delete({ where: { id } })
    return NextResponse.json({ message: 'Folder removed' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
