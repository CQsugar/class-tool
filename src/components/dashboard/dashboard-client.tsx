'use client'

import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

// 动态导入大型组件以优化首屏加载
const OverviewStats = dynamic(
  () => import('./overview-stats').then(mod => ({ default: mod.OverviewStats })),
  {
    ssr: false,
    loading: () => <div className="bg-muted h-32 animate-pulse rounded-lg" />,
  }
)
const QuickPointsPanel = dynamic(
  () => import('./quick-points-panel').then(mod => ({ default: mod.QuickPointsPanel })),
  {
    ssr: false,
    loading: () => <div className="bg-muted h-96 animate-pulse rounded-lg" />,
  }
)
const Leaderboard = dynamic(
  () => import('./leaderboard').then(mod => ({ default: mod.Leaderboard })),
  {
    ssr: false,
    loading: () => <div className="bg-muted h-96 animate-pulse rounded-lg" />,
  }
)

interface Student {
  id: string
  name: string
  studentNo: string
  points: number
}

interface DashboardClientProps {
  students: Student[]
}

export function DashboardClient({ students }: DashboardClientProps) {
  const router = useRouter()
  const [refreshKey, setRefreshKey] = useState(0)

  const handlePointsSuccess = () => {
    // 刷新服务端组件数据
    router.refresh()

    // 更新 key 以强制重新渲染子组件
    setRefreshKey(prev => prev + 1)
  }

  return (
    <>
      {/* 数据概览统计卡片 */}
      <OverviewStats key={`stats-${refreshKey}`} />

      {/* 主要功能区域 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 快速积分操作面板 */}
        <QuickPointsPanel students={students} onSuccess={handlePointsSuccess} />

        {/* 积分排行榜 */}
        <Leaderboard key={`leaderboard-${refreshKey}`} />
      </div>
    </>
  )
}
