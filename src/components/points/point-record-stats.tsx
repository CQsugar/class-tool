'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, RotateCcw, TrendingDown, TrendingUp } from 'lucide-react'

interface PointRecordStatsProps {
  stats: {
    totalRecords: number
    addRecords: number
    subtractRecords: number
    resetRecords: number
    totalPointsAdded: number
    totalPointsSubtracted: number
    netPointsChange: number
  }
}

export function PointRecordStats({ stats }: PointRecordStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">总记录数</CardTitle>
          <Activity className="text-muted-foreground h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalRecords}</div>
          <p className="text-muted-foreground mt-1 text-xs">全部积分变动记录</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">加分记录</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.addRecords}</div>
          <p className="text-muted-foreground mt-1 text-xs">
            累计加分 <span className="font-semibold">+{stats.totalPointsAdded}</span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">减分记录</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.subtractRecords}</div>
          <p className="text-muted-foreground mt-1 text-xs">
            累计减分 <span className="font-semibold">-{stats.totalPointsSubtracted}</span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">净变化</CardTitle>
          <RotateCcw className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${
              stats.netPointsChange > 0
                ? 'text-green-600'
                : stats.netPointsChange < 0
                  ? 'text-red-600'
                  : 'text-muted-foreground'
            }`}
          >
            {stats.netPointsChange > 0 && '+'}
            {stats.netPointsChange}
          </div>
          <p className="text-muted-foreground mt-1 text-xs">
            重置记录 <span className="font-semibold">{stats.resetRecords}</span> 次
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
