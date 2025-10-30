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
import { useSession } from '@/lib/auth-client'
import { isAdmin } from '@/lib/permissions'
import { Plus } from 'lucide-react'
import { redirect } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { createUserColumns } from './columns'
import { BanUserDialog } from './components/ban-user-dialog'
import { CreateUserDialog } from './components/create-user-dialog'
import { EditUserDialog } from './components/edit-user-dialog'
import { ResetPasswordDialog } from './components/reset-password-dialog'
import { UpdateRoleDialog } from './components/update-role-dialog'
import { UserDataTable } from './user-data-table'

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
  const [initialLoading, setInitialLoading] = useState(true)
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [dialogMode, setDialogMode] = useState<
    'create' | 'edit' | 'role' | 'ban' | 'reset-password' | null
  >(null)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalItems, setTotalItems] = useState(0)
  const [searchText, setSearchText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const pageCount = Math.ceil(totalItems / pageSize)

  useEffect(() => {
    if (session && !isAdmin(session.user)) {
      redirect('/dashboard')
    }
  }, [session])

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
      setInitialLoading(false)
    }
  }

  const handleSearch = () => {
    setSearchQuery(searchText)
    setCurrentPage(1)
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  useEffect(() => {
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, searchQuery])

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

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

  const refreshCurrentPage = () => {
    fetchUsers()
    setSelectedUsers([])
  }

  const handleEdit = (user: User) => {
    setSelectedUser(user)
    setDialogMode('edit')
  }

  const handleUpdateRole = (user: User) => {
    setSelectedUser(user)
    setDialogMode('role')
  }

  const handleBan = (user: User) => {
    setSelectedUser(user)
    setDialogMode('ban')
  }

  const handleResetPassword = (user: User) => {
    setSelectedUser(user)
    setDialogMode('reset-password')
  }

  const columns = createUserColumns({
    onEdit: handleEdit,
    onDelete: handleDeleteClick,
    onUpdateRole: handleUpdateRole,
    onBan: handleBan,
    onUnban: handleUnbanUser,
    onSendVerification: handleSendVerification,
    onResetPassword: handleResetPassword,
  })

  if (initialLoading) {
    return (
      <div className="flex h-[450px] items-center justify-center">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">用户管理</h2>
          <p className="text-muted-foreground text-sm sm:text-base">管理系统用户、角色和权限</p>
        </div>
        <Button onClick={() => setDialogMode('create')} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          创建新用户
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-2">
                <CardTitle>用户列表</CardTitle>
                <CardDescription>共 {totalItems} 个用户</CardDescription>
              </div>
              {selectedUsers.length > 0 && (
                <Badge variant="secondary" className="text-base">
                  已选择 {selectedUsers.length} 项
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <UserDataTable
            columns={columns}
            data={users}
            searchPlaceholder="搜索用户邮箱或姓名..."
            searchValue={searchText}
            onSearchChange={setSearchText}
            onSearch={handleSearch}
            onSearchKeyDown={handleSearchKeyDown}
            onSelectionChange={setSelectedUsers}
            loading={loading}
            currentPage={currentPage}
            pageSize={pageSize}
            pageCount={pageCount}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            onPageSizeChange={size => {
              setPageSize(size)
              setCurrentPage(1)
            }}
          />
        </CardContent>
      </Card>

      <CreateUserDialog
        open={dialogMode === 'create'}
        onOpenChange={(open: boolean) => !open && setDialogMode(null)}
        onSuccess={refreshCurrentPage}
      />

      {selectedUser && (
        <>
          <EditUserDialog
            open={dialogMode === 'edit'}
            user={selectedUser}
            onOpenChange={(open: boolean) => !open && setDialogMode(null)}
            onSuccess={refreshCurrentPage}
          />

          <UpdateRoleDialog
            open={dialogMode === 'role'}
            user={selectedUser}
            onOpenChange={(open: boolean) => !open && setDialogMode(null)}
            onSuccess={refreshCurrentPage}
          />

          <BanUserDialog
            open={dialogMode === 'ban'}
            user={selectedUser}
            onOpenChange={(open: boolean) => !open && setDialogMode(null)}
            onSuccess={refreshCurrentPage}
          />

          <ResetPasswordDialog
            open={dialogMode === 'reset-password'}
            user={selectedUser}
            onOpenChange={(open: boolean) => !open && setDialogMode(null)}
          />
        </>
      )}

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
