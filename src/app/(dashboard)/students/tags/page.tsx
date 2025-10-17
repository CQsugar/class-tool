'use client'

import {
  getStudentTagColumns,
  type StudentTagColumn,
} from '@/components/students/student-tag-columns'
import { StudentTagDataTable } from '@/components/students/student-tag-data-table'
import { StudentTagFormDialog } from '@/components/students/student-tag-form-dialog'
import { TagStudentsDialog } from '@/components/students/tag-students-dialog'
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
import { Loader2, Plus, Tags, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

type StudentTag = StudentTagColumn

interface TagStats {
  total: number
  totalStudentsTagged: number
  averageTagsPerStudent: number
}

export default function StudentTagsPage() {
  const [loading, setLoading] = useState(true)
  const [tags, setTags] = useState<StudentTag[]>([])
  const [stats, setStats] = useState<TagStats>({
    total: 0,
    totalStudentsTagged: 0,
    averageTagsPerStudent: 0,
  })
  const [showFormDialog, setShowFormDialog] = useState(false)
  const [showStudentsDialog, setShowStudentsDialog] = useState(false)
  const [editingTag, setEditingTag] = useState<StudentTag | null>(null)
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [tagToDelete, setTagToDelete] = useState<StudentTag | null>(null)

  useEffect(() => {
    loadTags()
  }, [])

  const loadTags = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/students/tags')
      if (!response.ok) throw new Error('加载标签失败')

      const data = await response.json()
      const allTags = (data.data || []).map((tag: StudentTag) => ({
        ...tag,
        createdAt: new Date(tag.createdAt),
      }))
      setTags(allTags)

      // 计算统计数据
      const totalStudentsTagged = new Set(
        allTags.flatMap((tag: StudentTag) => Array(tag._count.relations).fill(null))
      ).size

      const totalRelations = allTags.reduce(
        (sum: number, tag: StudentTag) => sum + tag._count.relations,
        0
      )

      const averageTagsPerStudent =
        totalStudentsTagged > 0 ? totalRelations / totalStudentsTagged : 0

      setStats({
        total: allTags.length,
        totalStudentsTagged,
        averageTagsPerStudent: Math.round(averageTagsPerStudent * 10) / 10,
      })
    } catch (error) {
      console.error('Failed to load tags:', error)
      toast.error('加载标签失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingTag(null)
    setShowFormDialog(true)
  }

  const handleEdit = (tag: StudentTagColumn) => {
    const fullTag = tags.find(t => t.id === tag.id)
    setEditingTag(fullTag || null)
    setShowFormDialog(true)
  }

  const handleViewStudents = (tag: StudentTagColumn) => {
    setSelectedTagId(tag.id)
    setShowStudentsDialog(true)
  }

  const handleDeleteClick = (tag: StudentTagColumn) => {
    const fullTag = tags.find(t => t.id === tag.id)
    setTagToDelete(fullTag || null)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!tagToDelete) return

    try {
      const response = await fetch(`/api/students/tags/${tagToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '删除失败')
      }

      toast.success('已删除标签')
      loadTags()
    } catch (error) {
      console.error('Failed to delete tag:', error)
      toast.error(error instanceof Error ? error.message : '删除失败')
    } finally {
      setDeleteDialogOpen(false)
      setTagToDelete(null)
    }
  }

  const handleFormSuccess = () => {
    setShowFormDialog(false)
    setEditingTag(null)
    loadTags()
  }

  const handleStudentsSuccess = () => {
    loadTags()
  }

  const enhancedColumns = getStudentTagColumns({
    onEdit: handleEdit,
    onDelete: handleDeleteClick,
    onViewStudents: handleViewStudents,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">学生标签</h1>
        <p className="text-muted-foreground">创建和管理学生标签，支持多标签分类和批量操作</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总标签数</CardTitle>
            <Tags className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-muted-foreground text-xs">所有标签</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已标记学生</CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudentsTagged}</div>
            <p className="text-muted-foreground text-xs">拥有标签的学生</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">人均标签</CardTitle>
            <Tags className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageTagsPerStudent}</div>
            <p className="text-muted-foreground text-xs">平均每人标签数</p>
          </CardContent>
        </Card>
      </div>

      {/* 标签列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>标签列表</CardTitle>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              新建标签
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
            </div>
          ) : (
            <StudentTagDataTable columns={enhancedColumns} data={tags} />
          )}
        </CardContent>
      </Card>

      {/* 创建/编辑对话框 */}
      <StudentTagFormDialog
        open={showFormDialog}
        onOpenChange={setShowFormDialog}
        tag={editingTag}
        onSuccess={handleFormSuccess}
      />

      {/* 学生管理对话框 */}
      <TagStudentsDialog
        open={showStudentsDialog}
        onOpenChange={setShowStudentsDialog}
        tagId={selectedTagId}
        onSuccess={handleStudentsSuccess}
      />

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除标签 &ldquo;{tagToDelete?.name}&rdquo; 吗？
              <br />
              <br />
              此操作将：
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>永久删除此标签</li>
                <li>移除所有学生的此标签</li>
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
