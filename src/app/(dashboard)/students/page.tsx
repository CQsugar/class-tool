'use client'

import { Student } from '@prisma/client'
import { Archive, BookCheck, Download, Plus, Tag, Upload, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { ApplyRuleDialog } from '@/components/points/apply-rule-dialog'
import { QuickPointsDialog } from '@/components/points/quick-points-dialog'
import { BatchTagDialog } from '@/components/students/batch-tag-dialog'
import { createStudentColumns } from '@/components/students/columns'
import { DataTable } from '@/components/students/data-table'
import { ExportStudentDialog } from '@/components/students/export-student-dialog'
import { ImportStudentDialog } from '@/components/students/import-student-dialog'
import { StudentDetailDialog } from '@/components/students/student-detail-dialog'
import { StudentFormDialog } from '@/components/students/student-form-dialog'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true) // 初始加载状态
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [quickPointsOpen, setQuickPointsOpen] = useState(false)
  const [applyRuleOpen, setApplyRuleOpen] = useState(false)
  const [batchTagOpen, setBatchTagOpen] = useState(false)
  const [tagMode, setTagMode] = useState<'add' | 'remove'>('add')
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [viewingStudentId, setViewingStudentId] = useState<string | null>(null)

  // AlertDialog状态
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false)
  const [archiveAlertOpen, setArchiveAlertOpen] = useState(false)
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null)

  // 分页和搜索状态
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalItems, setTotalItems] = useState(0)
  const [searchText, setSearchText] = useState('') // 输入框的值
  const [searchQuery, setSearchQuery] = useState('') // 实际查询的值
  const [groupFilter, setGroupFilter] = useState<string>('all') // 分组过滤
  const [tagFilter, setTagFilter] = useState<string>('all') // 标签过滤
  const [groups, setGroups] = useState<Array<{ id: string; name: string }>>([])
  const [tags, setTags] = useState<Array<{ id: string; name: string }>>([])
  const pageCount = Math.ceil(totalItems / pageSize)

  // 获取学生列表
  const fetchStudents = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        isArchived: 'false', // 只显示未归档的学生
      })

      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim())
      }

      if (groupFilter !== 'all') {
        params.append('groupId', groupFilter)
      }

      if (tagFilter !== 'all') {
        params.append('tagId', tagFilter)
      }

      const response = await fetch(`/api/students?${params}`)

      if (!response.ok) {
        throw new Error('获取学生列表失败')
      }

      const result = await response.json()

      setStudents(result.data || [])
      setTotalItems(result.pagination?.total || 0)
    } catch (error) {
      console.error('获取学生列表失败:', error)
      toast.error('获取学生列表失败')
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

  // 加载分组列表
  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/students/groups')
      if (response.ok) {
        const data = await response.json()
        setGroups(data.groups || [])
      }
    } catch (error) {
      console.error('加载分组列表失败:', error)
    }
  }

  // 加载标签列表
  const fetchTags = async () => {
    try {
      const response = await fetch('/api/students/tags')
      if (response.ok) {
        const data = await response.json()
        setTags(data.tags || [])
      }
    } catch (error) {
      console.error('加载标签列表失败:', error)
    }
  }

  useEffect(() => {
    fetchGroups()
    fetchTags()
  }, [])

  useEffect(() => {
    fetchStudents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, searchQuery, groupFilter, tagFilter])

  // 编辑学生
  const handleEdit = (student: Student) => {
    setEditingStudent(student)
    setDialogOpen(true)
  }

  // 删除学生 - 打开确认对话框
  const handleDelete = (student: Student) => {
    setDeletingStudent(student)
    setDeleteAlertOpen(true)
  }

  // 确认删除学生
  const confirmDelete = async () => {
    if (!deletingStudent) return

    try {
      const response = await fetch(`/api/students/${deletingStudent.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('删除学生失败')
      }

      toast.success('学生已删除')
      fetchStudents()
    } catch (error) {
      console.error('删除学生失败:', error)
      toast.error('删除学生失败')
    } finally {
      setDeleteAlertOpen(false)
      setDeletingStudent(null)
    }
  }

  // 添加学生
  const handleAdd = () => {
    setEditingStudent(null)
    setDialogOpen(true)
  }

  // 批量归档 - 打开确认对话框
  const handleBatchArchive = () => {
    if (selectedStudents.length === 0) {
      toast.warning('请先选择学生')
      return
    }
    setArchiveAlertOpen(true)
  }

  // 确认批量归档
  const confirmBatchArchive = async () => {
    try {
      const response = await fetch('/api/students/batch/archive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentIds: selectedStudents.map(s => s.id),
          isArchived: true,
        }),
      })

      if (!response.ok) {
        throw new Error('批量归档失败')
      }

      toast.success('学生已批量归档')
      setSelectedStudents([])
      fetchStudents()
    } catch (error) {
      console.error('批量归档失败:', error)
      toast.error('批量归档失败')
    } finally {
      setArchiveAlertOpen(false)
    }
  }

  // 快速加减分
  const handleQuickPoints = () => {
    if (selectedStudents.length === 0) {
      toast.warning('请先选择学生')
      return
    }
    setQuickPointsOpen(true)
  }

  // 应用规则
  const handleApplyRule = () => {
    if (selectedStudents.length === 0) {
      toast.warning('请先选择学生')
      return
    }
    setApplyRuleOpen(true)
  }

  // 积分操作成功后的回调
  const handlePointsSuccess = () => {
    fetchStudents()
    setSelectedStudents([])
  }

  // 批量添加标签
  const handleBatchAddTag = () => {
    if (selectedStudents.length === 0) {
      toast.warning('请先选择学生')
      return
    }
    setTagMode('add')
    setBatchTagOpen(true)
  }

  // 批量移除标签
  const handleBatchRemoveTag = () => {
    if (selectedStudents.length === 0) {
      toast.warning('请先选择学生')
      return
    }
    setTagMode('remove')
    setBatchTagOpen(true)
  }

  // 标签操作成功后的回调
  const handleTagSuccess = () => {
    fetchStudents()
  }

  // 导出Excel
  const handleExport = () => {
    setExportDialogOpen(true)
  }

  // 导入Excel
  const handleImport = () => {
    setImportDialogOpen(true)
  }

  // 查看详情
  const handleViewDetail = (student: Student) => {
    setViewingStudentId(student.id)
    setDetailDialogOpen(true)
  }

  const columns = createStudentColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
    onViewDetail: handleViewDetail,
  })

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
          <h2 className="text-3xl font-bold tracking-tight">学生管理</h2>
          <p className="text-muted-foreground">管理班级学生信息，支持批量操作和数据导入导出</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleImport}>
            <Upload className="mr-2 h-4 w-4" />
            导入
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            导出
          </Button>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            添加学生
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-2">
                <CardTitle>学生列表</CardTitle>
                <CardDescription>共 {students.length} 名学生</CardDescription>
              </div>
              {selectedStudents.length > 0 && (
                <Badge variant="secondary" className="text-base">
                  已选择 {selectedStudents.length} 项
                </Badge>
              )}
            </div>
            {selectedStudents.length > 0 && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleQuickPoints} className="gap-2">
                  <Zap className="h-4 w-4" />
                  快速加减分 ({selectedStudents.length})
                </Button>
                <Button variant="outline" onClick={handleApplyRule} className="gap-2">
                  <BookCheck className="h-4 w-4" />
                  应用规则 ({selectedStudents.length})
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Tag className="h-4 w-4" />
                      标签操作 ({selectedStudents.length})
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleBatchAddTag}>添加标签</DropdownMenuItem>
                    <DropdownMenuItem onClick={handleBatchRemoveTag}>移除标签</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" onClick={handleBatchArchive} className="gap-2">
                  <Archive className="h-4 w-4" />
                  批量归档 ({selectedStudents.length})
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* 过滤器 */}
          <div className="mb-4 flex items-center gap-4">
            <Select
              value={groupFilter}
              onValueChange={value => {
                setGroupFilter(value)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="选择分组" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部分组</SelectItem>
                {groups.map(group => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={tagFilter}
              onValueChange={value => {
                setTagFilter(value)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="选择标签" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部标签</SelectItem>
                {tags.map(tag => (
                  <SelectItem key={tag.id} value={tag.id}>
                    {tag.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(groupFilter !== 'all' || tagFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setGroupFilter('all')
                  setTagFilter('all')
                  setCurrentPage(1)
                }}
              >
                清除过滤
              </Button>
            )}
          </div>

          <DataTable
            columns={columns}
            data={students}
            searchKey="name"
            searchPlaceholder="搜索学生姓名、学号 (支持多个,用逗号或空格分隔)..."
            searchValue={searchText}
            onSearchChange={setSearchText}
            onSearch={handleSearch}
            onSearchKeyDown={handleSearchKeyDown}
            onSelectionChange={setSelectedStudents}
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

      {/* 学生表单对话框 */}
      <StudentFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        student={editingStudent}
        onSuccess={fetchStudents}
      />

      {/* Excel 导入对话框 */}
      <ImportStudentDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onSuccess={fetchStudents}
      />

      {/* Excel 导出对话框 */}
      <ExportStudentDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        students={students}
        selectedStudents={selectedStudents}
      />

      {/* 快速加减分对话框 */}
      <QuickPointsDialog
        open={quickPointsOpen}
        onOpenChange={setQuickPointsOpen}
        selectedStudentIds={selectedStudents.map(s => s.id)}
        studentNames={selectedStudents.map(s => s.name)}
        onSuccess={handlePointsSuccess}
      />

      {/* 应用规则对话框 */}
      <ApplyRuleDialog
        open={applyRuleOpen}
        onOpenChange={setApplyRuleOpen}
        selectedStudentIds={selectedStudents.map(s => s.id)}
        studentNames={selectedStudents.map(s => s.name)}
        onSuccess={handlePointsSuccess}
      />

      {/* 批量标签操作对话框 */}
      <BatchTagDialog
        open={batchTagOpen}
        onOpenChange={setBatchTagOpen}
        studentIds={selectedStudents.map(s => s.id)}
        mode={tagMode}
        onSuccess={handleTagSuccess}
      />

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除学生</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除学生 <span className="font-semibold">{deletingStudent?.name}</span> 吗？
              <br />
              此操作将永久删除该学生的所有信息,包括积分记录、点名记录等,且无法恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 批量归档确认对话框 */}
      <AlertDialog open={archiveAlertOpen} onOpenChange={setArchiveAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认批量归档</AlertDialogTitle>
            <AlertDialogDescription>
              确定要归档 <span className="font-semibold">{selectedStudents.length}</span> 个学生吗？
              <br />
              归档后的学生将不再显示在主列表中,但可以在&ldquo;归档学生&rdquo;页面查看。
              <br />
              归档的学生无法进行任何操作,仅用于数据分析。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBatchArchive}>确认归档</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 学生详情对话框 */}
      <StudentDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        studentId={viewingStudentId}
      />
    </div>
  )
}
