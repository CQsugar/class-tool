'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingDown, TrendingUp, Trophy } from 'lucide-react'
import { useEffect, useState } from 'react'

interface LeaderboardStudent {
  id: string
  name: string
  studentNo: string
  avatar: string | null
  points: number
  rank: number
}

export function Leaderboard() {
  const [students, setStudents] = useState<LeaderboardStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<'desc' | 'asc'>('desc')

  const fetchLeaderboard = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/dashboard/leaderboard?order=${order}&limit=10`)
      if (!response.ok) throw new Error('Failed to fetch leaderboard')
      const data = await response.json()
      setStudents(data.students)
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeaderboard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order])

  const toggleOrder = () => {
    setOrder(prev => (prev === 'desc' ? 'asc' : 'desc'))
  }

  const getRankColor = (rank: number) => {
    if (order === 'desc') {
      // 正向排序: 前三名特殊颜色
      if (rank === 1) return 'text-yellow-500'
      if (rank === 2) return 'text-gray-400'
      if (rank === 3) return 'text-amber-600'
    }
    return 'text-muted-foreground'
  }

  const getRankIcon = (rank: number) => {
    if (order === 'desc' && rank <= 3) {
      return <Trophy className={`h-5 w-5 ${getRankColor(rank)}`} />
    }
    return <span className="text-muted-foreground text-lg font-bold">{rank}</span>
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {order === 'desc' ? (
                <TrendingUp className="h-5 w-5" />
              ) : (
                <TrendingDown className="h-5 w-5" />
              )}
              积分排行榜
            </CardTitle>
            <CardDescription>
              {order === 'desc' ? '积分最高的学生' : '积分最低的学生'}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={toggleOrder}>
            {order === 'desc' ? '查看倒数' : '查看前列'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {students.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">暂无数据</p>
        ) : (
          <div className="space-y-3">
            {students.map(student => (
              <div
                key={student.id}
                className="hover:bg-muted/50 flex items-center gap-3 rounded-lg border p-3 transition-colors"
              >
                {/* 排名 */}
                <div className="flex h-10 w-10 items-center justify-center">
                  {getRankIcon(student.rank)}
                </div>

                {/* 头像 */}
                <Avatar className="h-10 w-10">
                  <AvatarImage src={student.avatar || undefined} />
                  <AvatarFallback>{student.name[0]}</AvatarFallback>
                </Avatar>

                {/* 学生信息 */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{student.name}</p>
                    {order === 'desc' && student.rank <= 3 && (
                      <Badge variant="secondary" className="text-xs">
                        Top {student.rank}
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm">{student.studentNo}</p>
                </div>

                {/* 积分 */}
                <div className="text-right">
                  <div className="text-lg font-bold">{student.points}</div>
                  <p className="text-muted-foreground text-xs">积分</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
