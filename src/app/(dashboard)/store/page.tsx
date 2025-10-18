'use client'

import { ItemType } from '@prisma/client'
import { ChevronLeft, ChevronRight, Crown, Gift, Package, Plus, Search } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { StoreItemFormDialog } from '@/components/store/store-item-form-dialog'
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
import { Skeleton } from '@/components/ui/skeleton'

interface StoreItem {
  id: string
  name: string
  description: string | null
  cost: number
  image: string | null
  type: ItemType
  stock: number | null
  sortOrder: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  _count: {
    redemptions: number
  }
}

const TYPE_ICONS = {
  VIRTUAL: Package,
  PHYSICAL: Gift,
  PRIVILEGE: Crown,
}

const TYPE_LABELS = {
  VIRTUAL: '虚拟奖励',
  PHYSICAL: '实物奖励',
  PRIVILEGE: '特权奖励',
}

const TYPE_COLORS = {
  VIRTUAL: 'text-blue-600 bg-blue-50',
  PHYSICAL: 'text-green-600 bg-green-50',
  PRIVILEGE: 'text-purple-600 bg-purple-50',
}

export default function StoreItemsPage() {
  const [items, setItems] = useState<StoreItem[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<StoreItem | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<StoreItem | null>(null)

  // 分页和过滤状态
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [pageCount, setPageCount] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('') // 用于输入框的即时值
  const [typeFilter, setTypeFilter] = useState<ItemType | 'all'>('all')
  const [activeFilter, setActiveFilter] = useState<string>('all')

  // 防抖搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput)
      setCurrentPage(1) // 搜索时重置到第一页
    }, 500) // 500ms 防抖

    return () => clearTimeout(timer)
  }, [searchInput])

  // 加载商品列表
  const loadItems = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      })

      if (search) params.append('search', search)
      if (typeFilter !== 'all') params.append('type', typeFilter)
      if (activeFilter !== 'all') params.append('isActive', activeFilter)

      const response = await fetch(`/api/store/items?${params}`)
      if (!response.ok) throw new Error('加载商品列表失败')

      const data = await response.json()
      setItems(data.items || [])
      setTotal(data.pagination.total || 0)
      setPageCount(data.pagination.pageCount || 1)
    } catch (error) {
      console.error('Failed to load items:', error)
      toast.error('加载商品列表失败')
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, search, typeFilter, activeFilter])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  // 处理编辑
  const handleEdit = (item: StoreItem) => {
    setEditingItem(item)
    setFormOpen(true)
  }

  // 处理删除
  const handleDelete = (item: StoreItem) => {
    setItemToDelete(item)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!itemToDelete) return

    try {
      const response = await fetch(`/api/store/items/${itemToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '删除失败')
      }

      toast.success('商品已删除')
      loadItems()
    } catch (error) {
      console.error('Failed to delete item:', error)
      toast.error(error instanceof Error ? error.message : '删除商品失败')
    } finally {
      setDeleteDialogOpen(false)
      setItemToDelete(null)
    }
  }

  // 切换上架状态
  const toggleActive = async (item: StoreItem) => {
    try {
      const response = await fetch(`/api/store/items/${item.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: !item.isActive,
        }),
      })

      if (!response.ok) throw new Error('更新状态失败')

      toast.success(item.isActive ? '商品已下架' : '商品已上架')
      loadItems()
    } catch (error) {
      console.error('Failed to toggle active:', error)
      toast.error('更新状态失败')
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      {/* 页面标题 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">商品管理</h1>
          <p className="text-muted-foreground text-sm">管理积分商城的商品和兑换奖励</p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          添加商品
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">商品列表</CardTitle>
          <CardDescription>
            共 {total} 件商品，第 {currentPage} / {pageCount || 1} 页
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 筛选栏 */}
          <div className="flex flex-wrap gap-3">
            {/* 搜索框 */}
            <div className="relative min-w-[200px] flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="搜索商品名称或描述..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* 类型筛选 */}
            <Select
              value={typeFilter}
              onValueChange={value => {
                setTypeFilter(value as ItemType | 'all')
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="选择类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="VIRTUAL">虚拟奖励</SelectItem>
                <SelectItem value="PHYSICAL">实物奖励</SelectItem>
                <SelectItem value="PRIVILEGE">特权奖励</SelectItem>
              </SelectContent>
            </Select>

            {/* 状态筛选 */}
            <Select
              value={activeFilter}
              onValueChange={value => {
                setActiveFilter(value)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="true">已上架</SelectItem>
                <SelectItem value="false">已下架</SelectItem>
              </SelectContent>
            </Select>

            {/* 每页数量 */}
            <Select
              value={pageSize.toString()}
              onValueChange={value => {
                setPageSize(Number(value))
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 条/页</SelectItem>
                <SelectItem value="20">20 条/页</SelectItem>
                <SelectItem value="50">50 条/页</SelectItem>
                <SelectItem value="100">100 条/页</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 商品列表 */}
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Skeleton className="h-20 w-20 rounded-md" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <Package className="text-muted-foreground mb-4 h-12 w-12" />
              <p className="mb-2 text-lg font-medium">
                {search || typeFilter !== 'all' || activeFilter !== 'all'
                  ? '未找到符合条件的商品'
                  : '还没有商品'}
              </p>
              <p className="text-muted-foreground text-sm">
                {search || typeFilter !== 'all' || activeFilter !== 'all'
                  ? '尝试调整筛选条件'
                  : '点击"添加商品"创建第一个商品'}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map(item => {
                const Icon = TYPE_ICONS[item.type]
                const getInitial = (name: string) => name.charAt(0).toUpperCase()

                return (
                  <Card key={item.id} className={!item.isActive ? 'opacity-60' : ''}>
                    <CardContent className="p-4">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                        {/* 图片 */}
                        <div className="flex-shrink-0">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-20 w-20 rounded-md object-cover"
                            />
                          ) : (
                            <div className="bg-primary/10 text-primary flex h-20 w-20 items-center justify-center rounded-md text-2xl font-bold">
                              {getInitial(item.name)}
                            </div>
                          )}
                        </div>

                        {/* 内容 */}
                        <div className="flex min-h-0 flex-1 flex-col space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="leading-tight font-semibold">{item.name}</h3>
                            {!item.isActive && (
                              <Badge variant="secondary" className="shrink-0 text-xs">
                                已下架
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className={`gap-1 ${TYPE_COLORS[item.type]}`}>
                              <Icon className="h-3 w-3" />
                              {TYPE_LABELS[item.type]}
                            </Badge>
                            <span className="text-primary text-sm font-bold">{item.cost} 积分</span>
                          </div>

                          {/* 描述 - 固定高度避免布局不一致 */}
                          <div className="min-h-[2.5rem]">
                            {item.description && (
                              <p className="text-muted-foreground line-clamp-2 text-sm">
                                {item.description}
                              </p>
                            )}
                          </div>

                          {/* 库存信息 - 固定高度避免布局不一致 */}
                          <div className="text-muted-foreground flex min-h-[1.25rem] flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                            {item.stock !== null && <span>库存: {item.stock}</span>}
                            <span>已兑换: {item._count.redemptions}</span>
                          </div>

                          {/* 按钮组 - 三个按钮等宽 */}
                          <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleEdit(item)}
                            >
                              编辑
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => toggleActive(item)}
                            >
                              {item.isActive ? '下架' : '上架'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleDelete(item)}
                              disabled={item._count.redemptions > 0}
                            >
                              删除
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* 分页 */}
          {!loading && pageCount > 1 && (
            <div className="flex flex-col gap-4 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-muted-foreground text-center text-sm sm:text-left">
                显示 {(currentPage - 1) * pageSize + 1} 到 {Math.min(currentPage * pageSize, total)}{' '}
                条，共 {total} 条
              </div>
              <div className="flex items-center justify-center gap-2 sm:justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="hidden sm:inline-flex"
                >
                  首页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="ml-1 hidden sm:inline">上一页</span>
                </Button>
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-muted-foreground">第</span>
                  <span className="font-medium">{currentPage}</span>
                  <span className="text-muted-foreground">/ {pageCount} 页</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(pageCount, p + 1))}
                  disabled={currentPage >= pageCount}
                >
                  <span className="mr-1 hidden sm:inline">下一页</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(pageCount)}
                  disabled={currentPage >= pageCount}
                  className="hidden sm:inline-flex"
                >
                  末页
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 添加/编辑对话框 */}
      <StoreItemFormDialog
        open={formOpen}
        onOpenChange={open => {
          setFormOpen(open)
          if (!open) setEditingItem(null)
        }}
        item={editingItem}
        onSuccess={loadItems}
      />

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除商品 &ldquo;{itemToDelete?.name}&rdquo; 吗？
              <br />
              {itemToDelete?._count.redemptions === 0
                ? '此操作不可恢复。'
                : '该商品有兑换记录，无法删除。建议将其下架。'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>取消</AlertDialogCancel>
            {itemToDelete?._count.redemptions === 0 && (
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive">
                删除
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
