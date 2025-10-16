'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  AccountSettingsCards, 
  SecuritySettingsCards,
  UserAvatar 
} from '@daveyplate/better-auth-ui'
import { SessionManagement } from './session-management'
import { SecurityOverview } from './security-overview'

export function ProfileForm() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 用户头像部分 */}
      <div className="flex items-center space-x-4 p-6 bg-muted/30 rounded-lg">
        <UserAvatar className="h-16 w-16" />
        <div>
          <h2 className="text-lg font-semibold">个人资料</h2>
          <p className="text-sm text-muted-foreground">管理您的账户信息和安全设置</p>
        </div>
      </div>

      {/* 设置标签页 */}
      <Tabs defaultValue="account" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="account">账户设置</TabsTrigger>
          <TabsTrigger value="security">安全设置</TabsTrigger>
          <TabsTrigger value="sessions">会话管理</TabsTrigger>
          <TabsTrigger value="overview">安全概览</TabsTrigger>
        </TabsList>
        
        <TabsContent value="account" className="space-y-4">
          <AccountSettingsCards />
        </TabsContent>
        
        <TabsContent value="security" className="space-y-4">
          <SecuritySettingsCards />
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <SessionManagement />
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <SecurityOverview />
        </TabsContent>
      </Tabs>
    </div>
  )
}