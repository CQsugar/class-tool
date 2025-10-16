'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Shield, AlertTriangle, CheckCircle, Monitor } from 'lucide-react'
import { useSession } from '@/lib/auth-client'

export function SecurityOverview() {
  const { data: session } = useSession()

  const securityTips = [
    {
      icon: Shield,
      title: '启用双因素认证',
      description: '为您的账户添加额外的安全层保护',
      status: 'warning',
      action: '立即启用'
    },
    {
      icon: CheckCircle,
      title: '密码强度良好',
      description: '您的密码符合安全要求',
      status: 'success'
    },
    {
      icon: AlertTriangle,
      title: '定期更新密码',
      description: '建议每90天更换一次密码',
      status: 'info',
      action: '更改密码'
    }
  ]

  return (
    <div className="space-y-6">
      {/* 当前会话信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            当前会话
          </CardTitle>
          <CardDescription>
            您当前登录的设备和位置信息
          </CardDescription>
        </CardHeader>
        <CardContent>
          {session && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <Monitor className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">当前设备</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date().toLocaleString('zh-CN')}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                  活跃中
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 安全建议 */}
      <Card>
        <CardHeader>
          <CardTitle>安全建议</CardTitle>
          <CardDescription>
            以下建议可以帮助保护您的账户安全
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {securityTips.map((tip, index) => {
              const IconComponent = tip.icon
              return (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      tip.status === 'success' ? 'bg-green-100' :
                      tip.status === 'warning' ? 'bg-yellow-100' :
                      'bg-blue-100'
                    }`}>
                      <IconComponent className={`h-4 w-4 ${
                        tip.status === 'success' ? 'text-green-600' :
                        tip.status === 'warning' ? 'text-yellow-600' :
                        'text-blue-600'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium">{tip.title}</p>
                      <p className="text-sm text-muted-foreground">{tip.description}</p>
                    </div>
                  </div>
                  {tip.action && (
                    <Button variant="outline" size="sm">
                      {tip.action}
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}