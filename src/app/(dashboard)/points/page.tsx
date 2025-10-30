'use client'

import dynamic from 'next/dynamic'

import { PointRuleColumn, getPointRuleColumns } from '@/components/points/point-rule-columns'
import { PointRuleDataTable } from '@/components/points/point-rule-data-table'
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PointType } from '@prisma/client'
import { Plus, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

// 动态导入对话框组件
const PointRuleFormDialog = dynamic(
  () =>
    import('@/components/points/point-rule-form-dialog').then(mod => ({
      default: mod.PointRuleFormDialog,
    })),
  { ssr: false }
)
const ResetPointsDialog = dynamic(
  () =>
    import('@/components/points/reset-points-dialog').then(mod => ({
      default: mod.ResetPointsDialog,
    })),
  { ssr: false }
)

export default function PointsPage() {
  const [rules, setRules] = useState<PointRuleColumn[]>([])
  const [loading, setLoading] = useState(true)
  const [initialLoading, setInitialLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<PointRuleColumn | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [ruleToDelete, setRuleToDelete] = useState<PointRuleColumn | null>(null)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)

  // 分页和过滤状态
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [pageCount, setPageCount] = useState(1)
  const [search, setSearch] = useState('') // 实际查询的值
  const [typeFilter, setTypeFilter] = useState<PointType | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [activeFilter, setActiveFilter] = useState('all')
  const [categories, setCategories] = useState<string[]>([])

  // 加载规则列表
  const loadRules = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      })

      if (search) params.append('search', search)
      if (typeFilter !== 'all') params.append('type', typeFilter)
      if (categoryFilter !== 'all') params.append('category', categoryFilter)
      if (activeFilter !== 'all') params.append('isActive', activeFilter)

      const response = await fetch(`/api/points/rules?${params}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('API Error:', errorData)
        throw new Error(errorData.error || '加载规则列表失败')
      }

      const data = await response.json()
      console.log('API Response:', data) // 调试日志
      setRules(data.data || [])
      setPageCount(data.pagination?.totalPages || 1)

      // 提取所有分类（用于过滤器）
      const uniqueCategories = Array.from(
        new Set((data.data || []).map((r: PointRuleColumn) => r.category).filter(Boolean))
      ) as string[]
      setCategories(uniqueCategories)
    } catch (error) {
      console.error('Failed to load rules:', error)
      toast.error('加载规则列表失败')
    } finally {
      setLoading(false)
      setInitialLoading(false)
    }
  }

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearch(value)
    setCurrentPage(1)
  }

  useEffect(() => {
    loadRules()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, search, typeFilter, categoryFilter, activeFilter])

  // 处理编辑
  const handleEdit = (rule: PointRuleColumn) => {
    setEditingRule(rule)
    setFormOpen(true)
  }

  // 处理删除
  const handleDelete = (rule: PointRuleColumn) => {
    setRuleToDelete(rule)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!ruleToDelete) return

    try {
      const response = await fetch(`/api/points/rules/${ruleToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('删除规则失败')

      toast.success('规则已删除')
      loadRules()
    } catch (error) {
      console.error('Failed to delete rule:', error)
      toast.error('删除规则失败')
    } finally {
      setDeleteDialogOpen(false)
      setRuleToDelete(null)
    }
  }

  // 处理表单提交
  const handleFormSuccess = () => {
    setFormOpen(false)
    setEditingRule(null)
    loadRules()
  }

  const handleFormOpenChange = (open: boolean) => {
    setFormOpen(open)
    if (!open) {
      setEditingRule(null)
    }
  }

  const columns = getPointRuleColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
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
    <div className="container mx-auto px-2 py-4 sm:px-4 sm:py-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>积分规则管理</CardTitle>
              <CardDescription>管理班级积分加减规则和分类</CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                onClick={() => setResetDialogOpen(true)}
                className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground w-full sm:w-auto"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                重置积分
              </Button>
              <Button onClick={() => setFormOpen(true)} className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                添加规则
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <PointRuleDataTable
            columns={columns}
            data={rules}
            pageCount={pageCount}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={size => {
              setPageSize(size)
              setCurrentPage(1)
            }}
            onSearch={handleSearch}
            onTypeFilter={type => {
              setTypeFilter(type)
              setCurrentPage(1)
            }}
            onCategoryFilter={category => {
              setCategoryFilter(category)
              setCurrentPage(1)
            }}
            onActiveFilter={active => {
              setActiveFilter(active)
              setCurrentPage(1)
            }}
            categories={categories}
            loading={loading}
          />
        </CardContent>
      </Card>

      {/* 添加/编辑对话框 */}
      <PointRuleFormDialog
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        rule={editingRule}
        onSuccess={handleFormSuccess}
      />

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除规则 &quot;{ruleToDelete?.name}&quot; 吗？
              <br />
              此操作将移除规则，但不会删除已有的积分记录。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 积分重置对话框 */}
      <ResetPointsDialog
        open={resetDialogOpen}
        onOpenChange={setResetDialogOpen}
        onSuccess={() => {
          toast.success('积分重置成功')
          setResetDialogOpen(false)
        }}
      />
    </div>
  )
}
