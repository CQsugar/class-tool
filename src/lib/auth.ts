import { PrismaClient } from '@prisma/client'
import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { nextCookies } from 'better-auth/next-js'
import { multiSession } from 'better-auth/plugins'

const prisma = new PrismaClient()

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql', // 使用 PostgreSQL 数据库
  }),

  // 基础配置
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // 开发阶段暂时禁用邮箱验证
    disableSignUp: process.env.NEXT_PUBLIC_DISABLE_SIGNUP === 'true', // 支持通过环境变量禁用注册
  },

  // 账户字段映射配置
  account: {
    fields: {
      accountId: 'accountId',
      providerId: 'providerId',
    },
  },

  // 会话管理配置
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7天过期
    updateAge: 60 * 60 * 24, // 24小时更新一次
    freshAge: 60 * 60, // 1小时内的会话被认为是"新鲜"的
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5分钟缓存
    },
  },

  // 高级安全配置
  advanced: {
    crossSubDomainCookies: {
      enabled: false, // 生产环境可根据需要启用
    },
    useSecureCookies: process.env.NODE_ENV === 'production',
  },

  // 安全配置
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',

  // Next.js 插件配置 - 必须放在最后
  plugins: [
    multiSession({
      maximumSessions: 5, // 每个用户最多5个活动会话
    }),
    nextCookies(), // 处理 Next.js Cookie
  ],
})

// 导出类型以供客户端使用
export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
