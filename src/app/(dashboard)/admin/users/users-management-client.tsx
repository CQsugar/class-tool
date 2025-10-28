'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import {
  Ban,
  CheckCircle,
  Mail,
  Plus,
  Search,
  Shield,
  Trash2,
  UserCog,
  XCircle,
} from 'lucide-react'
import { redirect } from 'next/navigation'
import React, { useEffect, useState } from 'react'
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
  banExpires?: number
  emailVerified: boolean
  createdAt: string
}

interface PaginationInfo {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

interface UsersResponse {
  users: User[]
  pagination: PaginationInfo
}

export function UsersManagementClient() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true) // 初始加载状态
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [dialogMode, setDialogMode] = useState<'create' | 'role' | 'ban' | 'reset-password' | null>(
    null
  )

  // 删除确认对话框状态
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)

  // 分页和搜索状态
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalItems, setTotalItems] = useState(0)
  const [searchText, setSearchText] = useState('') // 输入框的值
  const [searchQuery, setSearchQuery] = useState('') // 实际查询的值
  const pageCount = Math.ceil(totalItems / pageSize)

  // 权限检查
  useEffect(() => {
    if (session && !isAdmin(session.user)) {
      redirect('/dashboard')
    }
  }, [session])

  // 获取用户列表
  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
      })

      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim())
      }

      const response = await fetch(`/api/admin/users?${params}`)
      if (!response.ok) throw new Error('获取用户列表失败')

      const data: UsersResponse = await response.json()
      setUsers(data.users || [])
      setTotalItems(data.pagination?.totalCount || 0)
    } catch (error) {
      console.error('获取用户列表失败:', error)
      toast.error('获取用户列表失败')
    } finally {
      setLoading(false)
      setInitialLoading(false) // 首次加载完成后设置为false
    }
  }

  // 处理搜索
  const handleSearch = () => {
    setSearchQuery(searchText)
    setCurrentPage(1) // 搜索时重置到第一页
  }

  // 处理搜索框回车
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  useEffect(() => {
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, searchQuery])

  // 打开删除确认对话框
  const handleDeleteClick = (user: User) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  // 确认删除用户
  const handleDeleteUser = async () => {
    if (!userToDelete) return

    try {
      const response = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('删除用户失败')

      toast.success('用户已删除')
      setDeleteDialogOpen(false)
      setUserToDelete(null)
      refreshCurrentPage()
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
      refreshCurrentPage()
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

  // 刷新当前页数据
  const refreshCurrentPage = () => {
    fetchUsers()
  }

  // 页面初始加载时显示全屏loading
  if (initialLoading) {
    return (
      <div className="flex h-[450px] items-center justify-center">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">用户管理</h2>
          <p className="text-muted-foreground">管理系统用户、角色和权限</p>
        </div>
        <Button onClick={() => setDialogMode('create')}>
          <Plus className="h-4 w-4" />
          创建新用户
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-2">
                <CardTitle>用户列表</CardTitle>
                <CardDescription>共 {users.length} 个用户</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* 搜索框 */}
          <div className="mb-4 flex items-center gap-4">
            <div className="flex max-w-md flex-1 items-center gap-2">
              <Input
                placeholder="搜索用户邮箱或姓名..."
                value={searchText || ''}
                onChange={event => setSearchText(event.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="flex-1"
              />
              <Button onClick={handleSearch} size="default" className="gap-2">
                <Search className="h-4 w-4" />
                查询
              </Button>
            </div>
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchText('')
                  setSearchQuery('')
                  setCurrentPage(1)
                }}
              >
                清除搜索
              </Button>
            )}
          </div>

          <div className="overflow-hidden rounded-md border">
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
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="text-muted-foreground">加载中...</div>
                    </TableCell>
                  </TableRow>
                ) : users.length ? (
                  users.map(user => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {user.role === 'admin' && <Shield className="h-4 w-4 text-yellow-500" />}
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role === 'admin' ? '管理员' : '普通用户'}
                          </Badge>
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
                        <div className="flex items-center gap-1">
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
                              className="text-green-500 hover:text-green-600"
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
                              className="text-red-500 hover:text-red-600"
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
                            onClick={() => handleDeleteClick(user)}
                            disabled={user.role === 'admin'}
                            title={user.role === 'admin' ? '无法删除管理员' : '删除用户'}
                            className="text-red-500 hover:text-red-600 disabled:text-gray-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      暂无数据
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* 分页组件 - 使用学生管理的分页风格 */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-2">
              <p className="text-muted-foreground text-sm">每页显示</p>
              <Select
                value={pageSize?.toString()}
                onValueChange={value => {
                  setPageSize(Number(value))
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-sm">条</p>
              <p className="text-muted-foreground text-sm">共 {totalItems} 项</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                上一页
              </Button>
              <div className="text-sm">
                第 {currentPage} / {pageCount || 1} 页
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage >= (pageCount || 1)}
              >
                下一页
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 创建用户对话框 */}
      <CreateUserDialog
        open={dialogMode === 'create'}
        onOpenChange={(open: boolean) => !open && setDialogMode(null)}
        onSuccess={refreshCurrentPage}
      />

      {/* 修改角色对话框 */}
      {selectedUser && (
        <UpdateRoleDialog
          open={dialogMode === 'role'}
          user={selectedUser}
          onOpenChange={(open: boolean) => !open && setDialogMode(null)}
          onSuccess={refreshCurrentPage}
        />
      )}

      {/* 封禁用户对话框 */}
      {selectedUser && (
        <BanUserDialog
          open={dialogMode === 'ban'}
          user={selectedUser}
          onOpenChange={(open: boolean) => !open && setDialogMode(null)}
          onSuccess={refreshCurrentPage}
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

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除用户</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除用户 &ldquo;{userToDelete?.name}&rdquo; ({userToDelete?.email}) 吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground mb-2 text-sm">此操作将：</p>
            <ul className="text-muted-foreground mt-2 list-inside list-disc space-y-1 text-sm">
              <li>永久删除用户账号</li>
              <li>删除所有相关数据</li>
              <li>清除所有会话记录</li>
              <li>无法恢复任何信息</li>
            </ul>
            <p className="mt-4 text-sm font-medium text-red-600">此操作无法撤销，请谨慎操作。</p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
