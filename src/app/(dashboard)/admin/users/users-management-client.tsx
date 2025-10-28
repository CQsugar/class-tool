'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useSession } from '@/lib/auth-client'
import { isAdmin } from '@/lib/permissions'
import { Ban, CheckCircle, Mail, Shield, Trash2, UserCog, XCircle } from 'lucide-react'
import { redirect } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { BanUserDialog } from './components/ban-user-dialog'
import { CreateUserDialog } from './components/create-user-dialog'
import { ResetPasswordDialog } from './components/reset-password-dialog'
import { UpdateRoleDialog } from './components/update-role-dialog'

interface User {
  id: string
  email: string
  name: string
  role: string
  banned: boolean
  banReason?: string | null
  banExpires?: string | null
  emailVerified: boolean
  createdAt: string
}

export function UsersManagementClient() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [dialogMode, setDialogMode] = useState<'create' | 'role' | 'ban' | 'reset-password' | null>(
    null
  )

  // 权限检查
  useEffect(() => {
    if (session && !isAdmin(session.user)) {
      redirect('/dashboard')
    }
  }, [session])

  // 加载用户列表
  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/users')
      if (!response.ok) throw new Error('加载用户列表失败')
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  // 删除用户
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('确定要删除此用户吗?此操作不可恢复!')) return

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('删除用户失败')
      toast.success('用户已删除')
      loadUsers()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '删除失败')
    }
  }

  // 解除封禁
  const handleUnbanUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/unban`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('解除封禁失败')
      toast.success('已解除封禁')
      loadUsers()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '操作失败')
    }
  }

  // 发送验证邮件
  const handleSendVerification = async (userId: string, email: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/send-verification`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('发送验证邮件失败')
      toast.success(`验证邮件已发送至 ${email}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '发送失败')
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">用户管理</h1>
          <p className="text-muted-foreground">管理系统用户、角色和权限</p>
        </div>
        <Button onClick={() => setDialogMode('create')}>创建新用户</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>用户列表</CardTitle>
          <CardDescription>共 {users.length} 个用户</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>邮箱</TableHead>
                <TableHead>姓名</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>邮箱验证</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {user.role === 'admin' && <Shield className="h-4 w-4 text-yellow-500" />}
                      <span className={user.role === 'admin' ? 'font-semibold' : ''}>
                        {user.role === 'admin' ? '管理员' : '普通用户'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.banned ? (
                      <div className="flex items-center gap-1 text-red-500">
                        <Ban className="h-4 w-4" />
                        <span>已封禁</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-green-500">
                        <CheckCircle className="h-4 w-4" />
                        <span>正常</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.emailVerified ? (
                      <div className="flex items-center gap-1 text-green-500">
                        <CheckCircle className="h-4 w-4" />
                        <span>已验证</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-gray-500">
                        <XCircle className="h-4 w-4" />
                        <span>未验证</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString('zh-CN')}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user)
                          setDialogMode('role')
                        }}
                        title="修改角色"
                      >
                        <UserCog className="h-4 w-4" />
                      </Button>

                      {user.banned ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnbanUser(user.id)}
                          title="解除封禁"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user)
                            setDialogMode('ban')
                          }}
                          title="封禁用户"
                        >
                          <Ban className="h-4 w-4" />
                        </Button>
                      )}

                      {!user.emailVerified && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSendVerification(user.id, user.email)}
                          title="发送验证邮件"
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user)
                          setDialogMode('reset-password')
                        }}
                        title="重置密码"
                      >
                        重置密码
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={user.role === 'admin'}
                        title={user.role === 'admin' ? '无法删除管理员' : '删除用户'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 创建用户对话框 */}
      <CreateUserDialog
        open={dialogMode === 'create'}
        onOpenChange={(open: boolean) => !open && setDialogMode(null)}
        onSuccess={loadUsers}
      />

      {/* 修改角色对话框 */}
      {selectedUser && (
        <UpdateRoleDialog
          open={dialogMode === 'role'}
          user={selectedUser}
          onOpenChange={(open: boolean) => !open && setDialogMode(null)}
          onSuccess={loadUsers}
        />
      )}

      {/* 封禁用户对话框 */}
      {selectedUser && (
        <BanUserDialog
          open={dialogMode === 'ban'}
          user={selectedUser}
          onOpenChange={(open: boolean) => !open && setDialogMode(null)}
          onSuccess={loadUsers}
        />
      )}

      {/* 重置密码对话框 */}
      {selectedUser && (
        <ResetPasswordDialog
          open={dialogMode === 'reset-password'}
          user={selectedUser}
          onOpenChange={(open: boolean) => !open && setDialogMode(null)}
        />
      )}
    </div>
  )
}
