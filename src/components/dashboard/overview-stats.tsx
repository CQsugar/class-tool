'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowDown, ArrowUp, ShoppingCart, TrendingUp, Users } from 'lucide-react'
import { useEffect, useState } from 'react'

interface OverviewData {
  students: {
    total: number
    active: number
    archived: number
    weekChange: number
  }
  points: {
    total: number
    weekChange: number
    todayRecords: number
    weekRecords: number
  }
  redemptions: {
    total: number
    thisWeek: number
  }
  calls: {
    today: number
  }
}

export function OverviewStats() {
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOverview()
  }, [])

  const fetchOverview = async () => {
    try {
      const response = await fetch('/api/dashboard/overview')
      if (!response.ok) throw new Error('Failed to fetch overview')
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Failed to fetch overview:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* 学生总数 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">学生总数</CardTitle>
          <Users className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.students.total}</div>
          <p className="text-muted-foreground flex items-center gap-1 text-xs">
            {data.students.weekChange > 0 && (
              <>
                <ArrowUp className="h-3 w-3 text-green-500" />
                <span className="text-green-500">+{data.students.weekChange}</span>
              </>
            )}
            {data.students.weekChange < 0 && (
              <>
                <ArrowDown className="h-3 w-3 text-red-500" />
                <span className="text-red-500">{data.students.weekChange}</span>
              </>
            )}
            {data.students.weekChange === 0 && <span>无变化</span>}
            <span className="ml-1">本周</span>
          </p>
        </CardContent>
      </Card>

      {/* 总积分 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">班级总积分</CardTitle>
          <TrendingUp className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.points.total.toLocaleString()}</div>
          <p className="text-muted-foreground flex items-center gap-1 text-xs">
            {data.points.weekChange >= 0 ? (
              <>
                <ArrowUp className="h-3 w-3 text-green-500" />
                <span className="text-green-500">+{data.points.weekChange}</span>
              </>
            ) : (
              <>
                <ArrowDown className="h-3 w-3 text-red-500" />
                <span className="text-red-500">{data.points.weekChange}</span>
              </>
            )}
            <span className="ml-1">本周变化</span>
          </p>
        </CardContent>
      </Card>

      {/* 积分记录 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">积分操作</CardTitle>
          <TrendingUp className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.points.todayRecords}</div>
          <p className="text-muted-foreground text-xs">
            今日操作 / 本周 {data.points.weekRecords} 次
          </p>
        </CardContent>
      </Card>

      {/* 商城兑换 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">商城兑换</CardTitle>
          <ShoppingCart className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.redemptions.total}</div>
          <p className="text-muted-foreground text-xs">本周 {data.redemptions.thisWeek} 次兑换</p>
        </CardContent>
      </Card>
    </div>
  )
}
