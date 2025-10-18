'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertCircle,
  Clock,
  Loader2,
  Maximize2,
  Minimize2,
  RefreshCw,
  User,
  Users,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface Student {
  id: string
  name: string
  studentNo: string
  avatar: string | null
  points: number
}

interface CallHistoryItem {
  id: string
  mode: string
  calledAt: string
  student: {
    id: string
    name: string
    studentNo: string
    avatar: string | null
  } | null
}

export default function CallPage() {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [isRolling, setIsRolling] = useState(false)
  const [avoidHours, setAvoidHours] = useState('24')
  const [history, setHistory] = useState<CallHistoryItem[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [stats, setStats] = useState({
    totalAvailable: 0,
    totalExcluded: 0,
    avoidResetUsed: false,
  })

  // 加载点名历史
  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    try {
      setLoadingHistory(true)
      const response = await fetch('/api/call/history?limit=10')
      if (!response.ok) throw new Error('Failed to load history')
      const data = await response.json()
      setHistory(data.histories || [])
    } catch (error) {
      console.error('Failed to load history:', error)
      toast.error('加载历史记录失败')
    } finally {
      setLoadingHistory(false)
    }
  }

  // 随机点名
  const handleRandomCall = async () => {
    try {
      setIsRolling(true)
      setSelectedStudent(null)
      setStats({
        totalAvailable: 0,
        totalExcluded: 0,
        avoidResetUsed: false,
      })

      // 添加一些延迟以显示动画效果
      await new Promise(resolve => setTimeout(resolve, 1500))

      const response = await fetch('/api/call/random', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avoidHours: parseInt(avoidHours),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '点名失败')
      }

      const data = await response.json()
      setSelectedStudent(data.student)
      setStats({
        totalAvailable: data.totalAvailable || 0,
        totalExcluded: data.totalExcluded || 0,
        avoidResetUsed: data.avoidResetUsed || false,
      })

      if (data.avoidResetUsed) {
        toast.warning(data.message)
      } else {
        toast.success(`点到了 ${data.student.name}！`)
      }

      // 刷新历史记录
      loadHistory()
    } catch (error) {
      console.error('Random call error:', error)
      toast.error(error instanceof Error ? error.message : '随机点名失败')
    } finally {
      setIsRolling(false)
    }
  }

  // 重新点名
  const handleReroll = () => {
    handleRandomCall()
  }

  // 切换全屏
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true)
      })
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false)
      })
    }
  }

  // 监听全屏变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  return (
    <div
      className={`flex flex-1 flex-col gap-6 p-4 pt-0 ${isFullscreen ? 'bg-background fixed inset-0 z-50 p-8' : ''}`}
    >
      {/* 页面标题 */}
      {!isFullscreen && (
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">随机点名</h1>
          <p className="text-muted-foreground">随机选择学生，支持24小时避重机制</p>
        </div>
      )}

      <div className={`grid gap-6 ${isFullscreen ? 'grid-cols-1' : 'lg:grid-cols-3'}`}>
        {/* 主要点名区域 */}
        <div className={isFullscreen ? '' : 'lg:col-span-2'}>
          <Card>
            <CardHeader>
              <CardTitle>开始点名</CardTitle>
              <CardDescription>点击按钮开始随机点名</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 避重设置 */}
              {!isFullscreen && (
                <div className="space-y-2">
                  <Label>避重时间</Label>
                  <Select value={avoidHours} onValueChange={setAvoidHours} disabled={isRolling}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">不启用避重</SelectItem>
                      <SelectItem value="1">1 小时</SelectItem>
                      <SelectItem value="6">6 小时</SelectItem>
                      <SelectItem value="12">12 小时</SelectItem>
                      <SelectItem value="24">24 小时</SelectItem>
                      <SelectItem value="48">48 小时</SelectItem>
                      <SelectItem value="72">72 小时</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-muted-foreground text-xs">
                    在设定时间内，已点过名的学生不会被重复点到
                  </p>
                </div>
              )}

              {/* 点名结果显示区域 */}
              <div
                className={`border-primary/20 from-primary/5 to-background flex flex-col items-center justify-center rounded-lg border-2 border-dashed bg-gradient-to-br p-8 ${isFullscreen ? 'min-h-[600px]' : 'min-h-[300px]'}`}
              >
                <AnimatePresence mode="wait">
                  {isRolling ? (
                    <motion.div
                      key="rolling"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex flex-col items-center gap-4"
                    >
                      <div className="relative">
                        <Loader2 className="text-primary h-16 w-16 animate-spin" />
                        <User className="text-primary absolute top-1/2 left-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2" />
                      </div>
                      <p className="text-muted-foreground animate-pulse text-lg font-medium">
                        正在随机选择...
                      </p>
                    </motion.div>
                  ) : selectedStudent ? (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, scale: 0.5, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ type: 'spring', duration: 0.6 }}
                      className="flex flex-col items-center gap-4"
                    >
                      {/* 学生头像 */}
                      <div className="relative">
                        <div
                          className={`bg-primary/10 ring-primary/30 flex items-center justify-center rounded-full ring-4 ring-offset-4 ${isFullscreen ? 'h-48 w-48' : 'h-32 w-32'}`}
                        >
                          {selectedStudent.avatar ? (
                            <img
                              src={selectedStudent.avatar}
                              alt={selectedStudent.name}
                              className={`rounded-full object-cover ${isFullscreen ? 'h-48 w-48' : 'h-32 w-32'}`}
                            />
                          ) : (
                            <span
                              className={`text-primary font-bold ${isFullscreen ? 'text-8xl' : 'text-5xl'}`}
                            >
                              {selectedStudent.name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.3, type: 'spring' }}
                          className={`bg-primary absolute -right-2 -bottom-2 flex items-center justify-center rounded-full shadow-lg ${isFullscreen ? 'h-16 w-16' : 'h-12 w-12'}`}
                        >
                          <User className={`text-white ${isFullscreen ? 'h-8 w-8' : 'h-6 w-6'}`} />
                        </motion.div>
                      </div>

                      {/* 学生信息 */}
                      <div className="text-center">
                        <motion.h2
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className={`mb-2 font-bold ${isFullscreen ? 'text-7xl' : 'text-4xl'}`}
                        >
                          {selectedStudent.name}
                        </motion.h2>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                          className="flex items-center justify-center gap-2"
                        >
                          <Badge variant="outline" className="font-mono">
                            {selectedStudent.studentNo}
                          </Badge>
                          <Badge variant="secondary">{selectedStudent.points} 积分</Badge>
                        </motion.div>
                      </div>

                      {/* 统计信息 */}
                      {stats.totalAvailable > 0 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.4 }}
                          className="text-muted-foreground mt-4 flex items-center gap-4 text-sm"
                        >
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            可选: {stats.totalAvailable}
                          </span>
                          {stats.totalExcluded > 0 && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              已排除: {stats.totalExcluded}
                            </span>
                          )}
                        </motion.div>
                      )}

                      {/* 避重重置提示 */}
                      {stats.avoidResetUsed && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 }}
                          className="mt-2 flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800"
                        >
                          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                          <span>所有学生都在避重期内，已自动重置避重机制</span>
                        </motion.div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center gap-4 text-center"
                    >
                      <div className="bg-muted flex h-20 w-20 items-center justify-center rounded-full">
                        <User className="text-muted-foreground h-10 w-10" />
                      </div>
                      <div>
                        <h3 className="mb-2 text-lg font-semibold">准备开始</h3>
                        <p className="text-muted-foreground text-sm">点击下方按钮开始随机点名</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-3">
                <Button
                  onClick={handleRandomCall}
                  disabled={isRolling}
                  className="flex-1"
                  size="lg"
                >
                  {isRolling ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      点名中...
                    </>
                  ) : (
                    <>
                      <User className="mr-2 h-5 w-5" />
                      开始点名
                    </>
                  )}
                </Button>
                {selectedStudent && !isRolling && (
                  <Button onClick={handleReroll} variant="outline" size="lg">
                    <RefreshCw className="mr-2 h-5 w-5" />
                    重新点名
                  </Button>
                )}
                <Button onClick={toggleFullscreen} variant="outline" size="lg">
                  {isFullscreen ? (
                    <>
                      <Minimize2 className="mr-2 h-5 w-5" />
                      退出全屏
                    </>
                  ) : (
                    <>
                      <Maximize2 className="mr-2 h-5 w-5" />
                      全屏显示
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 点名历史 */}
        {!isFullscreen && (
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>点名历史</CardTitle>
                <CardDescription>最近10次点名记录</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingHistory ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-1">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-muted-foreground flex flex-col items-center justify-center py-8 text-center text-sm">
                    <Clock className="mb-2 h-8 w-8 opacity-50" />
                    <p>还没有点名记录</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {history.map(item => (
                      <div
                        key={item.id}
                        className="hover:bg-muted/50 flex items-center gap-3 rounded-lg p-2 transition-colors"
                      >
                        <div className="bg-muted flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full">
                          {item.student?.avatar ? (
                            <img
                              src={item.student.avatar}
                              alt={item.student.name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-muted-foreground text-sm font-medium">
                              {item.student?.name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="truncate font-medium">{item.student?.name}</p>
                          <p className="text-muted-foreground truncate text-xs">
                            {new Date(item.calledAt).toLocaleString('zh-CN', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
