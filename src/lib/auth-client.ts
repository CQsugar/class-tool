import { adminClient, multiSessionClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  plugins: [
    adminClient(), // 添加管理员客户端插件
    multiSessionClient(),
  ],
})

// 导出常用的认证方法以便在组件中使用
export const { signIn, signUp, signOut, useSession } = authClient
