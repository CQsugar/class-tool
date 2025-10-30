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
      className={`flex flex-1 flex-col gap-4 p-2 pt-0 sm:gap-6 sm:p-4 sm:pt-0 ${isFullscreen ? 'bg-background fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8' : ''}`}
    >
      {/* 页面标题 */}
      {!isFullscreen && (
        <div className="space-y-1 sm:space-y-2">
          <h1 className="text-2xl font-bold sm:text-3xl">随机点名</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            随机选择学生，支持24小时避重机制
          </p>
        </div>
      )}

      <div
        className={`grid gap-4 sm:gap-6 ${isFullscreen ? 'w-full max-w-6xl grid-cols-1' : 'lg:grid-cols-3'}`}
      >
        {/* 主要点名区域 */}
        <div className={isFullscreen ? 'w-full' : 'lg:col-span-2'}>
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

              {/* 点名结果显示区域 - 优化后的设计 */}
              <div
                className={`relative flex flex-col items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-pink-500/10 p-8 shadow-inner ${isFullscreen ? 'min-h-[600px]' : 'min-h-[400px]'}`}
              >
                {/* 背景装饰效果 */}
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute top-0 left-0 h-40 w-40 animate-pulse rounded-full bg-violet-400/20 blur-3xl" />
                  <div className="animation-delay-1000 absolute right-0 bottom-0 h-40 w-40 animate-pulse rounded-full bg-fuchsia-400/20 blur-3xl" />
                  <div className="animation-delay-2000 absolute top-1/2 left-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full bg-pink-400/20 blur-3xl" />
                </div>

                <AnimatePresence mode="wait">
                  {isRolling ? (
                    <motion.div
                      key="rolling"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="relative z-10 flex flex-col items-center gap-6"
                    >
                      {/* 转盘式动画 */}
                      <div className="relative flex items-center justify-center">
                        {/* 外圈旋转 */}
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                          className="absolute h-32 w-32"
                        >
                          <div className="border-primary/30 absolute inset-0 rounded-full border-4 border-t-transparent border-r-transparent" />
                        </motion.div>
                        {/* 中圈旋转 */}
                        <motion.div
                          animate={{ rotate: -360 }}
                          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                          className="absolute h-24 w-24"
                        >
                          <div className="absolute inset-0 rounded-full border-4 border-fuchsia-500/40 border-b-transparent border-l-transparent" />
                        </motion.div>
                        {/* 中心图标 */}
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="bg-primary/10 relative z-10 flex h-20 w-20 items-center justify-center rounded-full backdrop-blur-sm"
                        >
                          <User className="text-primary h-10 w-10" />
                        </motion.div>
                      </div>

                      {/* 跳动的文字 */}
                      <motion.p
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 bg-clip-text text-2xl font-bold text-transparent"
                      >
                        正在随机抽取中...
                      </motion.p>

                      {/* 粒子效果指示器 */}
                      <div className="flex gap-2">
                        {[0, 1, 2, 3, 4].map(i => (
                          <motion.div
                            key={i}
                            animate={{
                              y: [0, -10, 0],
                              opacity: [0.3, 1, 0.3],
                            }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              delay: i * 0.1,
                            }}
                            className="bg-primary h-2 w-2 rounded-full"
                          />
                        ))}
                      </div>
                    </motion.div>
                  ) : selectedStudent ? (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, scale: 0.5, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ type: 'spring', duration: 0.6 }}
                      className="relative z-10 flex flex-col items-center gap-6"
                    >
                      {/* 庆祝粒子效果 */}
                      <div className="pointer-events-none absolute inset-0 overflow-hidden">
                        {[...Array(12)].map((_, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                            animate={{
                              opacity: [0, 1, 0],
                              scale: [0, 1, 0],
                              x: Math.cos((i * 2 * Math.PI) / 12) * 200,
                              y: Math.sin((i * 2 * Math.PI) / 12) * 200,
                            }}
                            transition={{ duration: 1.5, delay: i * 0.05 }}
                            className="absolute top-1/2 left-1/2 h-3 w-3 rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400"
                          />
                        ))}
                      </div>

                      {/* 荣誉光环 */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="relative"
                      >
                        {/* 外层光环动画 */}
                        <motion.div
                          animate={{
                            scale: [1, 1.1, 1],
                            opacity: [0.3, 0.5, 0.3],
                          }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className={`absolute inset-0 rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 blur-xl ${isFullscreen ? '-inset-8' : '-inset-4'}`}
                        />

                        {/* 学生头像卡片 */}
                        <div
                          className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-white to-gray-50 p-2 shadow-2xl ring-4 ring-white ${isFullscreen ? 'h-56 w-56' : 'h-40 w-40'}`}
                        >
                          {selectedStudent.avatar ? (
                            <img
                              src={selectedStudent.avatar}
                              alt={selectedStudent.name}
                              className="h-full w-full rounded-2xl object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500">
                              <span
                                className={`font-bold text-white ${isFullscreen ? 'text-8xl' : 'text-6xl'}`}
                              >
                                {selectedStudent.name.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* 皇冠图标 */}
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
                          className={`absolute -top-6 left-1/2 -translate-x-1/2 ${isFullscreen ? 'h-14 w-14' : 'h-10 w-10'}`}
                        >
                          <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg">
                            <User
                              className={`text-white ${isFullscreen ? 'h-8 w-8' : 'h-5 w-5'}`}
                            />
                          </div>
                        </motion.div>
                      </motion.div>

                      {/* 学生信息卡片 */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="w-full max-w-md space-y-4 text-center"
                      >
                        {/* 姓名 */}
                        <motion.h2
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                          className={`bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 bg-clip-text font-bold text-transparent ${isFullscreen ? 'text-7xl' : 'text-5xl'}`}
                        >
                          {selectedStudent.name}
                        </motion.h2>

                        {/* 信息徽章 */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.5 }}
                          className="flex items-center justify-center gap-3"
                        >
                          <Badge
                            variant="outline"
                            className="border-violet-300 bg-violet-50 px-4 py-2 font-mono text-violet-700"
                          >
                            {selectedStudent.studentNo}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-white"
                          >
                            {selectedStudent.points} 积分
                          </Badge>
                        </motion.div>
                      </motion.div>

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
                      className="relative z-10 flex flex-col items-center gap-6 text-center"
                    >
                      {/* 动态图标 */}
                      <motion.div
                        animate={{
                          scale: [1, 1.05, 1],
                          rotate: [0, 5, -5, 0],
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                        className="relative"
                      >
                        <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 shadow-2xl">
                          <User className="h-14 w-14 text-white" />
                        </div>
                        {/* 装饰圆环 */}
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                          className="absolute -inset-2 rounded-full border-2 border-dashed border-violet-300"
                        />
                      </motion.div>

                      {/* 提示文字 */}
                      <div className="space-y-2">
                        <h3 className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-2xl font-bold text-transparent">
                          准备开始随机点名
                        </h3>
                        <p className="text-muted-foreground text-sm">
                          点击下方&ldquo;开始点名&rdquo;按钮，开始精彩的随机抽取
                        </p>
                      </div>

                      {/* 装饰元素 */}
                      <div className="flex gap-2">
                        {[...Array(5)].map((_, i) => (
                          <motion.div
                            key={i}
                            animate={{
                              y: [0, -8, 0],
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              delay: i * 0.15,
                            }}
                            className="h-2 w-2 rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400"
                          />
                        ))}
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
