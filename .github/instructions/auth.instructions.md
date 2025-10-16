---
applyTo: "src/lib/auth.ts,src/app/api/auth/**/*.ts,middleware.ts,src/app/**/auth/**/*.tsx"
description: "Better Auth认证系统开发最佳实践"
---

# Better Auth 认证开发指令

## 基础配置
- 在`src/lib/auth.ts`中配置Better Auth
- 使用环境变量存储敏感信息
- 配置适当的会话策略
- 设置安全的cookie选项

## 路由保护
- 在`middleware.ts`中配置认证中间件
- 使用matcher精确匹配需要保护的路由
- 处理未认证用户的重定向
- 支持公开和受保护路由

## 会话管理
- 服务端组件使用`auth.api.getSession()`获取会话
- 客户端组件使用Better Auth的hooks
- 正确处理loading和error状态
- 实现安全的登出功能

## UI集成
- 使用Better Auth UI组件库
- 与shadcn/ui无缝集成
- 自定义认证表单样式
- 实现响应式登录界面

## 安全最佳实践
- 使用CSRF保护
- 配置安全的密钥
- 设置适当的会话过期时间
- 实现账户锁定机制

## 示例代码：

```typescript
// lib/auth.ts
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "@/lib/prisma"

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql"
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
    },
  },
})

// app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth"

export const { GET, POST } = auth.handler

// middleware.ts (Next.js >= 15.2.0)
import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session && !request.nextUrl.pathname.startsWith("/auth")) {
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  if (session && request.nextUrl.pathname.startsWith("/auth")) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  runtime: "nodejs",
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}

// 服务端组件中使用
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export default async function ProtectedPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  })
  
  if (!session) {
    redirect("/auth/login")
  }

  return <div>欢迎, {session.user.name}!</div>
}

// 客户端组件中使用
"use client"
import { useSession } from "better-auth/react"

export function UserProfile() {
  const { data: session, isPending } = useSession()

  if (isPending) return <div>加载中...</div>
  if (!session) return <div>请登录</div>

  return <div>你好, {session.user.name}!</div>
}
```

## Better Auth UI组件
- 使用`@better-auth/ui`包
- 预构建的shadcn/ui样式组件
- 支持登录、注册、密码重置
- 完全可自定义的样式

## 插件扩展
- 支持丰富的插件生态
- 可选择性启用高级功能
- 2FA、Passkeys、多租户等
- 自定义插件开发

## 错误处理
- 统一的错误处理机制
- 友好的错误信息提示
- 详细的开发调试信息
- 生产环境安全日志