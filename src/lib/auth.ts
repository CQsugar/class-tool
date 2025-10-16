import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { nextCookies } from 'better-auth/next-js'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql', // 使用 PostgreSQL 数据库
  }),

  // 基础配置
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // 开发阶段暂时禁用邮箱验证
  },

  // 安全配置
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',

  // Next.js 插件配置 - 必须放在最后
  plugins: [
    nextCookies(), // 处理 Next.js Cookie
  ],
})

// 导出类型以供客户端使用
export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
