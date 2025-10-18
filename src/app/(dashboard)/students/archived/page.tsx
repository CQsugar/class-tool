/**
 * 归档学生列表页面
 * 仅供查看,不支持任何操作
 */

'use client'

import { Student } from '@prisma/client'
import { Archive, Download } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { createArchivedStudentColumns } from '@/components/students/archived-columns'
import { DataTable } from '@/components/students/data-table'
import { ExportStudentDialog } from '@/components/students/export-student-dialog'
import { StudentDetailDialog } from '@/components/students/student-detail-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function ArchivedStudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [viewingStudentId, setViewingStudentId] = useState<string | null>(null)

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalItems, setTotalItems] = useState(0)
  const pageCount = Math.ceil(totalItems / pageSize)

  // 搜索状态
  const [searchText, setSearchText] = useState('') // 输入框的值
  const [searchQuery, setSearchQuery] = useState('') // 实际查询的值

  // 排序状态
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt'>('updatedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // 获取归档学生列表
  const fetchArchivedStudents = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        isArchived: 'true', // 只获取归档学生
        sortBy,
        sortOrder,
      })

      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim())
      }

      const response = await fetch(`/api/students?${params}`)

      if (!response.ok) {
        throw new Error('获取归档学生列表失败')
      }

      const result = await response.json()

      setStudents(result.data || [])
      setTotalItems(result.pagination?.total || 0)
    } catch (error) {
      console.error('获取归档学生列表失败:', error)
      toast.error('获取归档学生列表失败')
    } finally {
      setLoading(false)
      setInitialLoading(false)
    }
  }

  useEffect(() => {
    fetchArchivedStudents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, sortBy, sortOrder, searchQuery])

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

  // 导出Excel
  const handleExport = () => {
    setExportDialogOpen(true)
  }

  // 查看详情
  const handleViewDetail = (student: Student) => {
    setViewingStudentId(student.id)
    setDetailDialogOpen(true)
  }

  // 创建只读列配置
  const columns = createArchivedStudentColumns({
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
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">归档学生</h1>
          <p className="text-muted-foreground mt-2">查看已归档的学生信息,用于数据分析和历史记录</p>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          导出数据
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">归档学生总数</CardTitle>
            <Archive className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-muted-foreground text-xs">已归档的学生数量</p>
          </CardContent>
        </Card>
      </div>

      {/* 数据表格 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>归档学生列表</CardTitle>
              <CardDescription>仅供查看,不支持任何编辑操作</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={sortBy}
                onValueChange={(value: 'createdAt' | 'updatedAt') => setSortBy(value)}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">按创建时间</SelectItem>
                  <SelectItem value="updatedAt">按更新时间</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={sortOrder}
                onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">降序</SelectItem>
                  <SelectItem value="asc">升序</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={students}
            searchKey="name"
            searchPlaceholder="搜索学生姓名、学号 (支持多个,用逗号或空格分隔)..."
            searchValue={searchText}
            onSearchChange={setSearchText}
            onSearch={handleSearch}
            onSearchKeyDown={handleSearchKeyDown}
            loading={loading}
            currentPage={currentPage}
            pageSize={pageSize}
            pageCount={pageCount}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </CardContent>
      </Card>

      {/* 导出对话框 */}
      <ExportStudentDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        students={students}
      />

      {/* 学生详情对话框 */}
      <StudentDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        studentId={viewingStudentId}
      />
    </div>
  )
}
