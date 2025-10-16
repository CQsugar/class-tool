import { createAuthClient } from 'better-auth/react'
import { multiSessionClient } from 'better-auth/client/plugins'

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  plugins: [multiSessionClient()],
})

// 导出常用的认证方法以便在组件中使用
export const { signIn, signUp, signOut, useSession } = authClient
