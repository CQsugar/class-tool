'use client'

import { GroupMembersDialog } from '@/components/students/group-members-dialog'
import {
  getStudentGroupColumns,
  type StudentGroupColumn,
} from '@/components/students/student-group-columns'
import { StudentGroupDataTable } from '@/components/students/student-group-data-table'
import { StudentGroupFormDialog } from '@/components/students/student-group-form-dialog'
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
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Archive, FolderOpen, Loader2, Plus, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface GroupMember {
  id: string
  studentId: string
}

interface StudentGroup extends StudentGroupColumn {
  archived: boolean
  members: GroupMember[]
}

interface GroupStats {
  total: number
  active: number
  archived: number
  totalMembers: number
}

export default function StudentGroupsPage() {
  const [loading, setLoading] = useState(true)
  const [groups, setGroups] = useState<StudentGroup[]>([])
  const [stats, setStats] = useState<GroupStats>({
    total: 0,
    active: 0,
    archived: 0,
    totalMembers: 0,
  })
  const [showFormDialog, setShowFormDialog] = useState(false)
  const [showMembersDialog, setShowMembersDialog] = useState(false)
  const [editingGroup, setEditingGroup] = useState<StudentGroup | null>(null)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [groupToDelete, setGroupToDelete] = useState<StudentGroup | null>(null)

  useEffect(() => {
    loadGroups()
  }, [])

  const loadGroups = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/students/groups')
      if (!response.ok) throw new Error('加载分组失败')

      const data = await response.json()
      setGroups(data.data || [])

      // 计算统计数据
      const allGroups = data.data || []
      const active = allGroups.filter((g: StudentGroup) => !g.archived)
      const archived = allGroups.filter((g: StudentGroup) => g.archived)
      const totalMembers = allGroups.reduce(
        (sum: number, g: StudentGroup) => sum + g._count.members,
        0
      )

      setStats({
        total: allGroups.length,
        active: active.length,
        archived: archived.length,
        totalMembers,
      })
    } catch (error) {
      console.error('Failed to load groups:', error)
      toast.error('加载分组失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingGroup(null)
    setShowFormDialog(true)
  }

  const handleEdit = (group: StudentGroupColumn) => {
    // 从groups数组找到完整的group对象
    const fullGroup = groups.find(g => g.id === group.id)
    setEditingGroup(fullGroup || null)
    setShowFormDialog(true)
  }

  const handleViewMembers = (group: StudentGroupColumn) => {
    setSelectedGroupId(group.id)
    setShowMembersDialog(true)
  }

  const handleDeleteClick = (group: StudentGroupColumn) => {
    // 从groups数组找到完整的group对象
    const fullGroup = groups.find(g => g.id === group.id)
    setGroupToDelete(fullGroup || null)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!groupToDelete) return

    try {
      const response = await fetch(`/api/students/groups/${groupToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '删除失败')
      }

      toast.success('已删除分组')
      loadGroups()
    } catch (error) {
      console.error('Failed to delete group:', error)
      toast.error(error instanceof Error ? error.message : '删除失败')
    } finally {
      setDeleteDialogOpen(false)
      setGroupToDelete(null)
    }
  }

  const handleFormSuccess = () => {
    setShowFormDialog(false)
    setEditingGroup(null)
    loadGroups()
  }

  const handleMembersSuccess = () => {
    loadGroups()
  }

  // 增强的列定义，添加操作回调
  const enhancedColumns = getStudentGroupColumns({
    onEdit: handleEdit,
    onDelete: handleDeleteClick,
    onViewMembers: handleViewMembers,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">学生分组</h1>
        <p className="text-muted-foreground">创建和管理学生分组，便于批量操作</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总分组数</CardTitle>
            <FolderOpen className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-muted-foreground text-xs">所有分组</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃分组</CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-muted-foreground text-xs">正在使用</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已归档</CardTitle>
            <Archive className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.archived}</div>
            <p className="text-muted-foreground text-xs">历史分组</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总成员数</CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMembers}</div>
            <p className="text-muted-foreground text-xs">所有分组成员</p>
          </CardContent>
        </Card>
      </div>

      {/* 分组列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>分组列表</CardTitle>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              新建分组
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
            </div>
          ) : (
            <StudentGroupDataTable columns={enhancedColumns} data={groups} />
          )}
        </CardContent>
      </Card>

      {/* 创建/编辑对话框 */}
      <StudentGroupFormDialog
        open={showFormDialog}
        onOpenChange={setShowFormDialog}
        group={editingGroup || undefined}
        onSuccess={handleFormSuccess}
      />

      {/* 成员管理对话框 */}
      <GroupMembersDialog
        open={showMembersDialog}
        onOpenChange={setShowMembersDialog}
        groupId={selectedGroupId}
        onSuccess={handleMembersSuccess}
      />

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除分组 &quot;{groupToDelete?.name}&quot; 吗？
              <br />
              <br />
              此操作将：
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>永久删除此分组</li>
                <li>移除所有成员关系</li>
                <li>不影响学生数据</li>
              </ul>
              <br />
              此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
