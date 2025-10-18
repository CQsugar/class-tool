'use client'

import { ItemType } from '@prisma/client'
import { Crown, Gift, Package, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
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
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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
  const [pageSize] = useState(20)
  const [pageCount, setPageCount] = useState(1)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<ItemType | 'all'>('all')
  const [activeFilter, setActiveFilter] = useState('all')

  // 加载商品列表
  const loadItems = async () => {
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
      setItems(data.items)
      setPageCount(data.pagination.pageCount)
    } catch (error) {
      console.error('Failed to load items:', error)
      toast.error('加载商品列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, search, typeFilter, activeFilter])

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
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>商品管理</CardTitle>
              <CardDescription>管理积分商城的商品和兑换奖励</CardDescription>
            </div>
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              添加商品
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* 筛选栏 */}
          <div className="mb-6 flex flex-wrap gap-4">
            <div className="min-w-[200px] flex-1">
              <input
                type="text"
                placeholder="搜索商品..."
                value={search}
                onChange={e => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full rounded-md border px-3 py-2"
              />
            </div>
            <select
              value={typeFilter}
              onChange={e => {
                setTypeFilter(e.target.value as ItemType | 'all')
                setCurrentPage(1)
              }}
              className="rounded-md border px-3 py-2"
            >
              <option value="all">全部类型</option>
              <option value="VIRTUAL">虚拟奖励</option>
              <option value="PHYSICAL">实物奖励</option>
              <option value="PRIVILEGE">特权奖励</option>
            </select>
            <select
              value={activeFilter}
              onChange={e => {
                setActiveFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="rounded-md border px-3 py-2"
            >
              <option value="all">全部状态</option>
              <option value="true">已上架</option>
              <option value="false">已下架</option>
            </select>
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="text-muted-foreground">加载中...</div>
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <Package className="text-muted-foreground mb-4 h-12 w-12" />
              <p className="text-lg font-medium">还没有商品</p>
              <p className="text-muted-foreground text-sm">
                点击&ldquo;添加商品&rdquo;创建第一个商品
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map(item => {
                const Icon = TYPE_ICONS[item.type]
                // 获取商品名称首字母
                const getInitial = (name: string) => {
                  return name.charAt(0).toUpperCase()
                }
                return (
                  <Card key={item.id} className={!item.isActive ? 'opacity-60' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {item.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
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
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <h3 className="font-semibold">{item.name}</h3>
                            {!item.isActive && (
                              <span className="text-muted-foreground text-xs">已下架</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${TYPE_COLORS[item.type]}`}
                            >
                              <Icon className="h-3 w-3" />
                              {TYPE_LABELS[item.type]}
                            </span>
                            <span className="text-primary text-sm font-bold">{item.cost} 积分</span>
                          </div>
                          {item.description && (
                            <p className="text-muted-foreground line-clamp-2 text-sm">
                              {item.description}
                            </p>
                          )}
                          <div className="text-muted-foreground flex items-center gap-4 text-xs">
                            {item.stock !== null && <span>库存: {item.stock}</span>}
                            <span>已兑换: {item._count.redemptions}</span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleEdit(item)}
                            >
                              编辑
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => toggleActive(item)}>
                              {item.isActive ? '下架' : '上架'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
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
          {pageCount > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-muted-foreground text-sm">共 {pageCount} 页</div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
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
                  onClick={() => setCurrentPage(p => Math.min(pageCount, p + 1))}
                  disabled={currentPage >= pageCount}
                >
                  下一页
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
