'use client'

import { SessionsCard } from '@daveyplate/better-auth-ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function SessionManagement() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>会话管理</CardTitle>
          <CardDescription>管理您在不同设备上的登录会话，撤销可疑的登录状态</CardDescription>
        </CardHeader>
        <CardContent>
          <SessionsCard />
        </CardContent>
      </Card>
    </div>
  )
}
