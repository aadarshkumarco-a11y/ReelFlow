import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL || 'file:./db/reelflow.db'
  const authToken = process.env.TURSO_AUTH_TOKEN

  if (authToken && dbUrl.startsWith('libsql://')) {
    const adapter = new PrismaLibSql({ url: dbUrl, authToken })
    return new PrismaClient({ adapter, log: ['query'] })
  }
  return new PrismaClient({ log: ['query'] })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
