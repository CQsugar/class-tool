'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertTriangle,
  BarChart3,
  Coins,
  Crown,
  Gift,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useEffect, useState } from 'react'

interface StoreStats {
  overview: {
    totalItems: number
    activeItems: number
    totalRedemptions: number
    pendingRedemptions: number
    fulfilledRedemptions: number
    cancelledRedemptions: number
    totalPointsSpent: number
    periodRedemptions: number
    periodPointsSpent: number
    period: number
  }
  popularItems: Array<{
    id: string
    name: string
    type: 'VIRTUAL' | 'PHYSICAL' | 'PRIVILEGE'
    cost: number
    image: string | null
    redemptionCount: number
  }>
  categoryDistribution: Record<string, { count: number; totalCost: number }>
  dailyTrend: Array<{
    date: string
    count: number
    totalCost: number
  }>
  topRedeemers: Array<{
    id: string
    name: string
    studentNo: string
    avatar: string | null
    currentPoints: number
    redemptionCount: number
    totalSpent: number
  }>
  lowStockItems: Array<{
    id: string
    name: string
    type: 'VIRTUAL' | 'PHYSICAL' | 'PRIVILEGE'
    stock: number | null
    cost: number
  }>
}

const itemTypeConfig = {
  VIRTUAL: { label: '虚拟', icon: Package, color: 'bg-blue-500' },
  PHYSICAL: { label: '实物', icon: Gift, color: 'bg-green-500' },
  PRIVILEGE: { label: '特权', icon: Crown, color: 'bg-purple-500' },
}

export default function StoreStatsPage() {
  const [stats, setStats] = useState<StoreStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30')

  const fetchStats = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/store/stats?period=${period}`)
      if (!response.ok) throw new Error('Failed to fetch stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch store stats:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">加载统计数据失败</p>
        </div>
      </div>
    )
  }

  const { overview } = stats

  return (
    <div className="space-y-6">
      {/* 页头 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">商城统计</h1>
          <p className="text-muted-foreground">查看商城运营数据和趋势分析</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">最近7天</SelectItem>
            <SelectItem value="30">最近30天</SelectItem>
            <SelectItem value="90">最近90天</SelectItem>
            <SelectItem value="365">最近一年</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 概览统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">商品总数</CardTitle>
            <ShoppingCart className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalItems}</div>
            <p className="text-muted-foreground text-xs">在售: {overview.activeItems}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总兑换次数</CardTitle>
            <BarChart3 className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalRedemptions}</div>
            <p className="text-muted-foreground text-xs">
              近{overview.period}天: {overview.periodRedemptions}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">积分消费</CardTitle>
            <Coins className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalPointsSpent}</div>
            <p className="text-muted-foreground text-xs">
              近{overview.period}天: {overview.periodPointsSpent}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待处理兑换</CardTitle>
            <AlertTriangle className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.pendingRedemptions}</div>
            <p className="text-muted-foreground text-xs">已发放: {overview.fulfilledRedemptions}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 热门商品 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              热门商品
            </CardTitle>
            <CardDescription>兑换次数最多的商品 (近{overview.period}天内所有记录)</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.popularItems.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">暂无兑换记录</p>
            ) : (
              <div className="space-y-3">
                {stats.popularItems.map((item, index) => {
                  const config = itemTypeConfig[item.type]
                  const Icon = config.icon
                  return (
                    <div key={item.id} className="flex items-center gap-3 rounded-lg border p-3">
                      <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium">
                        {index + 1}
                      </div>
                      {item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-10 w-10 rounded-md object-cover"
                        />
                      ) : (
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-md ${config.color}`}
                        >
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-medium">{item.name}</p>
                          <Badge variant="outline">{config.label}</Badge>
                        </div>
                        <p className="text-muted-foreground text-sm">{item.cost} 积分</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{item.redemptionCount}</p>
                        <p className="text-muted-foreground text-xs">次兑换</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 学生兑换排行 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              学生兑换排行
            </CardTitle>
            <CardDescription>兑换次数最多的学生 (近{overview.period}天)</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.topRedeemers.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">暂无兑换记录</p>
            ) : (
              <div className="space-y-3">
                {stats.topRedeemers.map((student, index) => (
                  <div key={student.id} className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium">
                      {index + 1}
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={student.avatar || undefined} alt={student.name} />
                      <AvatarFallback>{student.name.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{student.name}</p>
                      <p className="text-muted-foreground text-sm">{student.studentNo}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{student.redemptionCount}</p>
                      <p className="text-muted-foreground text-xs">消费 {student.totalSpent}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 分类分布 */}
        <Card>
          <CardHeader>
            <CardTitle>商品分类分布</CardTitle>
            <CardDescription>各类商品的兑换情况 (仅统计已发放和待处理)</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(stats.categoryDistribution).length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">暂无数据</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(stats.categoryDistribution).map(([type, data]) => {
                  const config = itemTypeConfig[type as keyof typeof itemTypeConfig]
                  const Icon = config.icon
                  const total = Object.values(stats.categoryDistribution).reduce(
                    (sum, d) => sum + d.count,
                    0
                  )
                  const percentage = ((data.count / total) * 100).toFixed(1)

                  return (
                    <div key={type} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-md ${config.color}`}
                          >
                            <Icon className="h-4 w-4 text-white" />
                          </div>
                          <span className="font-medium">{config.label}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {data.count} 次 ({percentage}%)
                          </p>
                          <p className="text-muted-foreground text-xs">{data.totalCost} 积分</p>
                        </div>
                      </div>
                      <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                        <div className={config.color} style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 库存预警 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              库存预警
            </CardTitle>
            <CardDescription>库存不足的商品 (库存 &le; 5)</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.lowStockItems.length === 0 ? (
              <div className="py-8 text-center">
                <AlertTriangle className="text-muted-foreground mx-auto mb-2 h-12 w-12" />
                <p className="text-muted-foreground text-sm">所有商品库存充足</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.lowStockItems.map(item => {
                  const config = itemTypeConfig[item.type]
                  const Icon = config.icon
                  const isOutOfStock = item.stock === 0

                  return (
                    <div key={item.id} className="flex items-center gap-3 rounded-lg border p-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-md ${config.color}`}
                      >
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{item.name}</p>
                        <p className="text-muted-foreground text-sm">{item.cost} 积分</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={isOutOfStock ? 'destructive' : 'secondary'}>
                          库存: {item.stock}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 每日趋势 */}
      <Card>
        <CardHeader>
          <CardTitle>每日兑换趋势</CardTitle>
          <CardDescription>近{overview.period}天的兑换次数和积分消费</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.dailyTrend.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">暂无数据</p>
          ) : (
            <div className="space-y-2">
              {stats.dailyTrend.map(day => (
                <div key={day.date} className="flex items-center gap-4 rounded-lg border p-3">
                  <div className="w-24 text-sm font-medium">{day.date}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="bg-muted h-2 flex-1 overflow-hidden rounded-full">
                        <div
                          className="h-full bg-blue-500"
                          style={{
                            width: `${Math.min((day.count / Math.max(...stats.dailyTrend.map(d => d.count))) * 100, 100)}%`,
                          }}
                        />
                      </div>
                      <span className="w-16 text-right text-sm font-medium">{day.count} 次</span>
                    </div>
                  </div>
                  <div className="text-muted-foreground text-right text-sm">
                    {day.totalCost} 积分
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
