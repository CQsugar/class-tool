'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AnimatePresence, motion } from 'framer-motion'
import { Maximize2, Minimize2, Pause, Play, RotateCcw, Timer, Volume2, VolumeX } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

type TimerMode = 'countdown' | 'stopwatch'

export default function TimerPage() {
  const [mode, setMode] = useState<TimerMode>('countdown')
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)

  // 倒计时设置
  const [countdownMinutes, setCountdownMinutes] = useState('5')
  const [countdownSeconds, setCountdownSeconds] = useState('0')
  const [remainingTime, setRemainingTime] = useState(0) // 剩余秒数

  // 正计时
  const [elapsedTime, setElapsedTime] = useState(0) // 已过秒数

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // 初始化音频
  useEffect(() => {
    // 创建一个简单的提示音(可以替换为实际音频文件)
    audioRef.current = new Audio(
      'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjGH0fPTgjMGHm7A7+OZSA0PVKzn77BdGAg+ltrzxnMpBSh+zPLaizsIGGS57OmjTxELTqXh8bllHAU2jdXzzn0vBSd8yfDajDwJF2G56+ihUhALTKPi8bllHQU1i9Tz0H4yBSh8yO/cjT0JGF+36+mjUhELTKPh8bllHQU1i9Tz0H4yBSh8yO/cjT0JGF+36+mjUhELTKPh8bllHQU1i9Tz0H4yBSh8yO/cjT0JGF+36+mjUhELTKPh8bllHQU1i9Tz0H4yBSh8yO/cjT0JGF+36+mjUhELTKPh8bllHQU1i9Tz0H4yBSh8yO/cjT0JGF+36+mjUhELTKPh8bllHQU1i9Tz0H4yBSh8yO/cjT0JGF+36+mjUhELTKPh8bllHQU1i9Tz0H4yBSh8yO/cjT0JGF+36+mjUhELTKPh8bllHQU1i9Tz0H4yBSh8yO/cjT0JGF+36+mjUhELTKPh8bllHQU1i9Tz0H4yBSh8yO/cjT0JGF+36+mjUhELTKPh8bllHQU1i9Tz0H4yBSh8yO/cjT0JGF+36+mjUhELTKPh8bllHQU1i9Tz0H4yBSh8yO/cjT0JGF+36+mjUhELTKPh8bllHQU1i9Tz0H4yBSh8yO/cjT0JGF+36+mjUhELTKPh8Q=='
    )
  }, [])

  // 格式化时间显示
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // 播放提示音
  const playSound = () => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(err => console.error('Failed to play sound:', err))
    }
  }

  // 开始倒计时
  const startCountdown = () => {
    const minutes = parseInt(countdownMinutes) || 0
    const seconds = parseInt(countdownSeconds) || 0
    const totalSeconds = minutes * 60 + seconds

    if (totalSeconds <= 0) {
      toast.error('请设置有效的倒计时时间')
      return
    }

    setRemainingTime(totalSeconds)
    setIsRunning(true)
    setIsPaused(false)
    toast.success('倒计时开始')
  }

  // 开始正计时
  const startStopwatch = () => {
    setElapsedTime(0)
    setIsRunning(true)
    setIsPaused(false)
    toast.success('正计时开始')
  }

  // 暂停/继续
  const togglePause = () => {
    if (isPaused) {
      setIsPaused(false)
      toast.success('继续计时')
    } else {
      setIsPaused(true)
      toast.info('已暂停')
    }
  }

  // 重置
  const reset = () => {
    setIsRunning(false)
    setIsPaused(false)
    if (mode === 'countdown') {
      setRemainingTime(0)
    } else {
      setElapsedTime(0)
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    toast.info('已重置')
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

  // 计时器主逻辑
  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        if (mode === 'countdown') {
          setRemainingTime(prev => {
            if (prev <= 1) {
              // 倒计时结束
              setIsRunning(false)
              setIsPaused(false)
              playSound()
              toast.success('倒计时结束!', {
                duration: 5000,
              })
              return 0
            }
            return prev - 1
          })
        } else {
          setElapsedTime(prev => prev + 1)
        }
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isRunning, isPaused, mode])

  // 计算进度百分比(倒计时)
  const getProgress = (): number => {
    if (mode === 'countdown' && isRunning) {
      const total = (parseInt(countdownMinutes) || 0) * 60 + (parseInt(countdownSeconds) || 0)
      if (total === 0) return 0
      return ((total - remainingTime) / total) * 100
    }
    return 0
  }

  // 获取当前显示时间
  const getCurrentTime = (): string => {
    if (mode === 'countdown') {
      return formatTime(remainingTime)
    }
    return formatTime(elapsedTime)
  }

  // 获取时间状态颜色
  const getTimeColor = (): string => {
    if (!isRunning) return 'text-muted-foreground'
    if (mode === 'countdown' && remainingTime <= 10) {
      return 'text-destructive animate-pulse'
    }
    return 'text-foreground'
  }

  return (
    <div
      className={`flex flex-1 flex-col gap-6 p-4 pt-0 ${isFullscreen ? 'bg-background fixed inset-0 z-50 p-8' : ''}`}
    >
      {/* 页面标题 */}
      {!isFullscreen && (
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">课堂计时器</h1>
          <p className="text-muted-foreground">支持倒计时和正计时两种模式</p>
        </div>
      )}

      {isRunning ? (
        /* 计时器运行显示 */
        <div className="flex flex-1 flex-col items-center justify-center space-y-8">
          {/* 模式标识 */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <Timer className="text-primary h-8 w-8" />
            <Badge variant="outline" className="px-4 py-2 text-xl">
              {mode === 'countdown' ? '倒计时' : '正计时'}
            </Badge>
          </motion.div>

          {/* 时间显示 */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`font-mono text-9xl font-bold tabular-nums ${getTimeColor()} ${isFullscreen ? 'text-[16rem]' : ''}`}
          >
            {getCurrentTime()}
          </motion.div>

          {/* 进度条(倒计时) */}
          {mode === 'countdown' && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: '100%' }}
              className="w-full max-w-2xl"
            >
              <div className="bg-muted h-4 overflow-hidden rounded-full">
                <motion.div
                  className="bg-primary h-full transition-all duration-1000"
                  style={{ width: `${getProgress()}%` }}
                />
              </div>
              <p className="text-muted-foreground mt-2 text-center text-sm">
                已用时间:{' '}
                {formatTime(
                  (parseInt(countdownMinutes) || 0) * 60 +
                    (parseInt(countdownSeconds) || 0) -
                    remainingTime
                )}
              </p>
            </motion.div>
          )}

          {/* 控制按钮 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex gap-4"
          >
            <Button
              onClick={togglePause}
              size={isFullscreen ? 'lg' : 'default'}
              variant={isPaused ? 'default' : 'secondary'}
              className={isFullscreen ? 'h-16 w-16' : ''}
            >
              {isPaused ? <Play className="h-6 w-6" /> : <Pause className="h-6 w-6" />}
            </Button>
            <Button
              onClick={reset}
              size={isFullscreen ? 'lg' : 'default'}
              variant="outline"
              className={isFullscreen ? 'h-16 w-16' : ''}
            >
              <RotateCcw className="h-6 w-6" />
            </Button>
            <Button
              onClick={toggleFullscreen}
              size={isFullscreen ? 'lg' : 'default'}
              variant="outline"
              className={isFullscreen ? 'h-16 w-16' : ''}
            >
              {isFullscreen ? <Minimize2 className="h-6 w-6" /> : <Maximize2 className="h-6 w-6" />}
            </Button>
            <Button
              onClick={() => setSoundEnabled(!soundEnabled)}
              size={isFullscreen ? 'lg' : 'default'}
              variant="ghost"
              className={isFullscreen ? 'h-16 w-16' : ''}
            >
              {soundEnabled ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
            </Button>
          </motion.div>

          {/* 状态提示 */}
          <AnimatePresence>
            {isPaused && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="bg-muted absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg px-8 py-4"
              >
                <p className="text-muted-foreground text-2xl font-bold">已暂停</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        /* 计时器设置界面 */
        <Card>
          <CardHeader>
            <CardTitle>计时器设置</CardTitle>
            <CardDescription>选择计时模式并设置参数</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 模式选择 */}
            <Tabs value={mode} onValueChange={value => setMode(value as TimerMode)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="countdown">倒计时</TabsTrigger>
                <TabsTrigger value="stopwatch">正计时</TabsTrigger>
              </TabsList>

              <TabsContent value="countdown" className="space-y-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="minutes">分钟</Label>
                      <Input
                        id="minutes"
                        type="number"
                        min="0"
                        max="59"
                        value={countdownMinutes}
                        onChange={e => setCountdownMinutes(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="seconds">秒</Label>
                      <Input
                        id="seconds"
                        type="number"
                        min="0"
                        max="59"
                        value={countdownSeconds}
                        onChange={e => setCountdownSeconds(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* 快捷时间按钮 */}
                  <div className="space-y-2">
                    <Label>快捷设置</Label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: '1分钟', m: '1', s: '0' },
                        { label: '3分钟', m: '3', s: '0' },
                        { label: '5分钟', m: '5', s: '0' },
                        { label: '10分钟', m: '10', s: '0' },
                        { label: '15分钟', m: '15', s: '0' },
                        { label: '30分钟', m: '30', s: '0' },
                        { label: '45分钟', m: '45', s: '0' },
                        { label: '1小时', m: '60', s: '0' },
                      ].map(preset => (
                        <Button
                          key={preset.label}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCountdownMinutes(preset.m)
                            setCountdownSeconds(preset.s)
                          }}
                        >
                          {preset.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <p className="text-muted-foreground text-sm">
                    倒计时结束后将自动提醒并播放提示音
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="stopwatch" className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  正计时模式将从 00:00 开始计时,适用于需要记录用时的场景
                </p>
                <div className="border-primary/20 from-primary/5 to-background flex min-h-[200px] flex-col items-center justify-center rounded-lg border-2 border-dashed bg-gradient-to-br">
                  <Timer className="text-muted-foreground mb-4 h-16 w-16" />
                  <p className="text-muted-foreground text-sm">点击下方按钮开始正计时</p>
                </div>
              </TabsContent>
            </Tabs>

            {/* 开始按钮 */}
            <Button
              onClick={mode === 'countdown' ? startCountdown : startStopwatch}
              size="lg"
              className="w-full"
            >
              <Play className="mr-2 h-5 w-5" />
              开始计时
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
