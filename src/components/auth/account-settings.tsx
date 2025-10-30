'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSession } from '@/lib/auth-client'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export function AccountSettings() {
  const { data: session } = useSession()
  const user = session?.user
  const router = useRouter()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  // 当用户数据变化时更新状态
  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setEmail(user.email || '')
    }
  }, [user])

  // 更新姓名
  const handleUpdateName = async () => {
    if (!name.trim()) {
      toast.error('姓名不能为空')
      return
    }

    if (name === user?.name) {
      toast.info('姓名未修改')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name.trim() }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '更新姓名失败')
      }

      // 刷新页面数据
      router.refresh()

      toast.success('姓名更新成功')
    } catch (error) {
      console.error('Failed to update name:', error)
      toast.error(error instanceof Error ? error.message : '更新姓名失败')
      // 恢复原值
      setName(user?.name || '')
    } finally {
      setLoading(false)
    }
  }

  // 更新邮箱
  const handleUpdateEmail = async () => {
    if (!email.trim()) {
      toast.error('邮箱不能为空')
      return
    }

    // 简单的邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      toast.error('请输入有效的邮箱地址')
      return
    }

    if (email === user?.email) {
      toast.info('邮箱未修改')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '更新邮箱失败')
      }

      // 刷新页面数据
      router.refresh()

      toast.success('邮箱更新成功')
    } catch (error) {
      console.error('Failed to update email:', error)
      toast.error(error instanceof Error ? error.message : '更新邮箱失败')
      // 恢复原值
      setEmail(user?.email || '')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* 姓名设置 */}
      <Card>
        <CardHeader>
          <CardTitle>姓名</CardTitle>
          <CardDescription>设置您在系统中显示的姓名</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="name">姓名</Label>
          <Input
            id="name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="请输入您的姓名"
            disabled={loading}
          />
        </CardContent>
        <CardFooter>
          <Button onClick={handleUpdateName} disabled={loading || name === user.name}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            保存姓名
          </Button>
        </CardFooter>
      </Card>

      {/* 邮箱设置 */}
      <Card>
        <CardHeader>
          <CardTitle>邮箱地址</CardTitle>
          <CardDescription>您用于登录和接收通知的邮箱地址</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="email">邮箱</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="请输入您的邮箱"
            disabled={loading}
          />
        </CardContent>
        <CardFooter>
          <Button onClick={handleUpdateEmail} disabled={loading || email === user.email}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            保存邮箱
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
