'use client'

import { RedemptionStatus } from '@prisma/client'
import { CheckCircle, Clock, Crown, Gift, Package, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Redemption {
  id: string
  cost: number
  status: RedemptionStatus
  notes: string | null
  redeemedAt: Date
  fulfilledAt: Date | null
  student: {
    id: string
    name: string
    studentNo: string
  }
  item: {
    id: string
    name: string
    type: string
    image: string | null
  }
}

const STATUS_CONFIG = {
  PENDING: {
    label: '待发放',
    icon: Clock,
    color: 'bg-yellow-100 text-yellow-800',
  },
  FULFILLED: {
    label: '已发放',
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800',
  },
  CANCELLED: {
    label: '已取消',
    icon: XCircle,
    color: 'bg-gray-100 text-gray-800',
  },
}

const TYPE_ICONS = {
  VIRTUAL: Package,
  PHYSICAL: Gift,
  PRIVILEGE: Crown,
}

export default function RedemptionsPage() {
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRedemption, setSelectedRedemption] = useState<Redemption | null>(null)
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<'fulfill' | 'cancel' | null>(null)

  // 分页和过滤状态
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [pageCount, setPageCount] = useState(1)
  const [statusFilter, setStatusFilter] = useState<RedemptionStatus | 'all'>('all')

  // 加载兑换记录
  const loadRedemptions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
      })

      if (statusFilter !== 'all') params.append('status', statusFilter)

      const response = await fetch(`/api/store/redemptions?${params}`)
      if (!response.ok) throw new Error('加载兑换记录失败')

      const data = await response.json()
      setRedemptions(data.redemptions)
      setPageCount(data.pagination.pageCount)
    } catch (error) {
      console.error('Failed to load redemptions:', error)
      toast.error('加载兑换记录失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRedemptions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter])

  // 处理状态更新
  const handleStatusAction = (redemption: Redemption, action: 'fulfill' | 'cancel') => {
    setSelectedRedemption(redemption)
    setActionType(action)
    setActionDialogOpen(true)
  }

  const confirmAction = async () => {
    if (!selectedRedemption || !actionType) return

    try {
      const newStatus = actionType === 'fulfill' ? 'FULFILLED' : 'CANCELLED'

      const response = await fetch(`/api/store/redemptions/${selectedRedemption.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '操作失败')
      }

      toast.success(actionType === 'fulfill' ? '已标记为已发放' : '已取消兑换')
      loadRedemptions()
    } catch (error) {
      console.error('Failed to update status:', error)
      toast.error(error instanceof Error ? error.message : '操作失败')
    } finally {
      setActionDialogOpen(false)
      setSelectedRedemption(null)
      setActionType(null)
    }
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>兑换记录</CardTitle>
              <CardDescription>查看和管理学生的兑换记录</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* 筛选栏 */}
          <div className="mb-6 flex gap-4">
            <Select
              value={statusFilter}
              onValueChange={value => {
                setStatusFilter(value as RedemptionStatus | 'all')
                setCurrentPage(1)
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="全部状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="PENDING">待发放</SelectItem>
                <SelectItem value="FULFILLED">已发放</SelectItem>
                <SelectItem value="CANCELLED">已取消</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="text-muted-foreground">加载中...</div>
            </div>
          ) : redemptions.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <Package className="text-muted-foreground mb-4 h-12 w-12" />
              <p className="text-lg font-medium">还没有兑换记录</p>
              <p className="text-muted-foreground text-sm">学生兑换商品后会显示在这里</p>
            </div>
          ) : (
            <div className="space-y-4">
              {redemptions.map(redemption => {
                const StatusIcon = STATUS_CONFIG[redemption.status].icon
                const TypeIcon = TYPE_ICONS[redemption.item.type as keyof typeof TYPE_ICONS]

                return (
                  <Card key={redemption.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* 商品图片 */}
                        {redemption.item.image ? (
                          <img
                            src={redemption.item.image}
                            alt={redemption.item.name}
                            className="h-16 w-16 rounded-md object-cover"
                          />
                        ) : (
                          <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-md">
                            <TypeIcon className="text-muted-foreground h-6 w-6" />
                          </div>
                        )}

                        {/* 信息 */}
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold">{redemption.item.name}</h3>
                              <p className="text-muted-foreground text-sm">
                                学生: {redemption.student.name} ({redemption.student.studentNo})
                              </p>
                            </div>
                            <Badge className={STATUS_CONFIG[redemption.status].color}>
                              <StatusIcon className="mr-1 h-3 w-3" />
                              {STATUS_CONFIG[redemption.status].label}
                            </Badge>
                          </div>

                          <div className="text-muted-foreground flex items-center gap-4 text-sm">
                            <span>消耗积分: {redemption.cost}</span>
                            <span>兑换时间: {formatDate(redemption.redeemedAt)}</span>
                            {redemption.fulfilledAt && (
                              <span>发放时间: {formatDate(redemption.fulfilledAt)}</span>
                            )}
                          </div>

                          {redemption.notes && (
                            <p className="text-muted-foreground text-sm">
                              备注: {redemption.notes}
                            </p>
                          )}

                          {/* 操作按钮 */}
                          {redemption.status === 'PENDING' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleStatusAction(redemption, 'fulfill')}
                              >
                                标记为已发放
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusAction(redemption, 'cancel')}
                              >
                                取消兑换
                              </Button>
                            </div>
                          )}
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

      {/* 操作确认对话框 */}
      <AlertDialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'fulfill' ? '确认发放' : '确认取消'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'fulfill' ? (
                <>
                  确定要将商品 &ldquo;{selectedRedemption?.item.name}&rdquo; 标记为已发放吗？
                  <br />
                  学生: {selectedRedemption?.student.name}
                </>
              ) : (
                <>
                  确定要取消兑换吗？
                  <br />
                  学生的 {selectedRedemption?.cost} 积分将会退还，商品库存也会恢复。
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setActionDialogOpen(false)}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAction}>确认</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
