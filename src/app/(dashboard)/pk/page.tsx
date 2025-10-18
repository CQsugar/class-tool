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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AnimatePresence, motion } from 'framer-motion'
import { Award, Loader2, Maximize2, Minimize2, Swords, Trophy, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

type PKMode = 'INDIVIDUAL' | 'GROUP' | 'RANDOM'

interface Student {
  id: string
  name: string
  studentNo: string
  avatar: string | null
  points: number
}

interface GroupMember {
  student: Student
}

interface Group {
  id: string
  name: string
  description: string | null
  color: string | null
  members: GroupMember[]
}

interface PKParticipant {
  id: string
  type: 'STUDENT' | 'GROUP'
  studentId: string | null
  groupId: string | null
  isWinner: boolean
  student?: Student | null
  group?: Group | null
}

interface PKSession {
  id: string
  mode: PKMode
  status: 'ONGOING' | 'FINISHED' | 'CANCELLED'
  rewardPoints: number
  startedAt: string
  finishedAt: string | null
  participants: PKParticipant[]
}

export default function PKPage() {
  const [mode, setMode] = useState<PKMode>('RANDOM')
  const [isStarting, setIsStarting] = useState(false)
  const [rewardPoints, setRewardPoints] = useState('10')
  const [pkSession, setPKSession] = useState<PKSession | null>(null)
  const [_selectedStudents, _setSelectedStudents] = useState<string[]>([])
  const [_selectedGroups, _setSelectedGroups] = useState<string[]>([])
  const [isFullscreen, setIsFullscreen] = useState(false)

  // 全屏切换
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  // 开始 PK
  const handleStartPK = async () => {
    try {
      setIsStarting(true)
      setPKSession(null)

      // 添加延迟以显示动画
      await new Promise(resolve => setTimeout(resolve, 1500))

      const body: {
        mode: PKMode
        rewardPoints: number
        studentIds?: string[]
        groupIds?: string[]
      } = {
        mode,
        rewardPoints: parseInt(rewardPoints) || 0,
      }

      if (mode === 'INDIVIDUAL') {
        if (_selectedStudents.length !== 2) {
          toast.error('请选择2名学生')
          return
        }
        body.studentIds = _selectedStudents
      } else if (mode === 'GROUP') {
        if (_selectedGroups.length !== 2) {
          toast.error('请选择2个分组')
          return
        }
        body.groupIds = _selectedGroups
      }

      const response = await fetch('/api/pk/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '创建PK会话失败')
      }

      const data = await response.json()
      setPKSession(data.session)
      toast.success('PK对战开始!')
    } catch (error) {
      console.error('Start PK error:', error)
      toast.error(error instanceof Error ? error.message : '开始PK失败')
    } finally {
      setIsStarting(false)
    }
  }

  // 设置胜者
  const handleSetWinner = async (winnerId: string, winnerType: 'STUDENT' | 'GROUP') => {
    if (!pkSession) return

    try {
      const response = await fetch(`/api/pk/sessions/${pkSession.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          winnerId,
          winnerType,
          status: 'FINISHED',
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '设置胜者失败')
      }

      const data = await response.json()
      setPKSession(data.session)
      toast.success('PK结果已保存!')
    } catch (error) {
      console.error('Set winner error:', error)
      toast.error(error instanceof Error ? error.message : '设置胜者失败')
    }
  }

  // 渲染参与者卡片
  const renderParticipantCard = (participant: PKParticipant, index: number) => {
    const isWinner = participant.isWinner
    const isStudent = participant.type === 'STUDENT'

    return (
      <motion.div
        key={participant.id}
        initial={{ opacity: 0, scale: 0.8, x: index === 0 ? -50 : 50 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ delay: 0.2 + index * 0.2 }}
        className="relative"
      >
        <Card className={`${isWinner ? 'ring-primary/30 ring-4 ring-offset-4' : ''}`}>
          <CardHeader className="text-center">
            {isWinner && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                className={`bg-primary absolute left-1/2 -translate-x-1/2 rounded-full p-3 shadow-lg ${
                  isFullscreen ? '-top-8' : '-top-6'
                }`}
              >
                <Trophy className={isFullscreen ? 'h-8 w-8 text-white' : 'h-6 w-6 text-white'} />
              </motion.div>
            )}
            <CardTitle className={isFullscreen ? 'text-4xl' : 'text-2xl'}>
              {isStudent ? participant.student?.name : participant.group?.name}
            </CardTitle>
            <CardDescription>
              {isStudent
                ? participant.student?.studentNo
                : `${participant.group?.members?.length || 0} 名成员`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 头像或分组信息 */}
            <div className="flex justify-center">
              {isStudent ? (
                participant.student?.avatar ? (
                  <img
                    src={participant.student.avatar}
                    alt={participant.student.name}
                    className={`rounded-full object-cover ring-4 ring-offset-4 ${
                      isFullscreen ? 'h-32 w-32' : 'h-24 w-24'
                    } ${isWinner ? 'ring-primary' : 'ring-transparent'}`}
                  />
                ) : (
                  <div
                    className={`bg-muted flex items-center justify-center rounded-full font-bold ring-4 ring-offset-4 ${
                      isFullscreen ? 'h-32 w-32 text-5xl' : 'h-24 w-24 text-3xl'
                    } ${isWinner ? 'ring-primary' : 'ring-transparent'}`}
                  >
                    {participant.student?.name.charAt(0)}
                  </div>
                )
              ) : (
                <div
                  className={`flex items-center justify-center rounded-full font-bold ring-4 ring-offset-4 ${
                    isFullscreen ? 'h-32 w-32 text-5xl' : 'h-24 w-24 text-3xl'
                  } ${isWinner ? 'ring-primary' : 'ring-transparent'}`}
                  style={{
                    backgroundColor: participant.group?.color || '#gray',
                  }}
                >
                  <Users
                    className={isFullscreen ? 'h-16 w-16 text-white' : 'h-12 w-12 text-white'}
                  />
                </div>
              )}
            </div>

            {/* 积分 */}
            {isStudent && (
              <div className="text-center">
                <Badge variant="secondary" className="text-lg">
                  {participant.student?.points} 积分
                </Badge>
              </div>
            )}

            {/* 分组成员列表 */}
            {!isStudent && participant.group?.members && (
              <div className="space-y-2">
                <p className="text-muted-foreground text-center text-sm">成员列表</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {participant.group.members.slice(0, 5).map((member: GroupMember) => (
                    <Badge key={member.student.id} variant="outline">
                      {member.student.name}
                    </Badge>
                  ))}
                  {participant.group.members.length > 5 && (
                    <Badge variant="outline">+{participant.group.members.length - 5}</Badge>
                  )}
                </div>
              </div>
            )}

            {/* 设置胜者按钮 */}
            {pkSession?.status === 'ONGOING' && !isWinner && (
              <Button
                onClick={() => {
                  const winnerId = isStudent ? participant.student?.id : participant.group?.id
                  if (winnerId) {
                    handleSetWinner(winnerId, isStudent ? 'STUDENT' : 'GROUP')
                  }
                }}
                className="w-full"
                variant="outline"
              >
                <Award className="mr-2 h-4 w-4" />
                设为胜者
              </Button>
            )}

            {isWinner && (
              <Badge className="w-full justify-center py-2 text-lg" variant="default">
                <Trophy className="mr-2 h-4 w-4" />
                胜者
              </Badge>
            )}
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <div
      className={`flex flex-1 flex-col gap-6 p-4 pt-0 ${isFullscreen ? 'bg-background fixed inset-0 z-50 overflow-auto p-8' : ''}`}
    >
      {/* 页面标题 */}
      {!isFullscreen && (
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">PK对战</h1>
          <p className="text-muted-foreground">支持个人PK、分组PK和随机PK三种模式</p>
        </div>
      )}

      {pkSession ? (
        /* PK 对战显示区域 */
        <div className="space-y-6">
          {/* 对战信息 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>PK对战</CardTitle>
                  <CardDescription>
                    {pkSession.mode === 'INDIVIDUAL' && '个人对战'}
                    {pkSession.mode === 'GROUP' && '分组对战'}
                    {pkSession.mode === 'RANDOM' && '随机对战'}
                  </CardDescription>
                </div>
                <Badge
                  variant={pkSession.status === 'FINISHED' ? 'default' : 'secondary'}
                  className="text-lg"
                >
                  {pkSession.status === 'ONGOING' && '进行中'}
                  {pkSession.status === 'FINISHED' && '已完成'}
                  {pkSession.status === 'CANCELLED' && '已取消'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground flex items-center justify-center gap-4 text-sm">
                {pkSession.rewardPoints > 0 && (
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    <span>奖励: {pkSession.rewardPoints} 积分</span>
                  </div>
                )}
                <div>
                  <span>开始时间: {new Date(pkSession.startedAt).toLocaleString('zh-CN')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 参与者对战区域 */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* 参与者 1 */}
            {pkSession.participants[0] && renderParticipantCard(pkSession.participants[0], 0)}

            {/* VS 标志 */}
            <div className="flex items-center justify-center">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.4, type: 'spring' }}
                className={`flex items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-blue-500 shadow-xl ${
                  isFullscreen ? 'h-32 w-32' : 'h-24 w-24'
                }`}
              >
                <Swords
                  className={isFullscreen ? 'h-16 w-16 text-white' : 'h-12 w-12 text-white'}
                />
              </motion.div>
            </div>

            {/* 参与者 2 */}
            {pkSession.participants[1] && renderParticipantCard(pkSession.participants[1], 1)}
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-center gap-4">
            <Button onClick={() => setPKSession(null)} variant="outline" size="lg">
              开始新的PK
            </Button>
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
        </div>
      ) : (
        /* PK 设置区域 */
        !isFullscreen && (
          <Card>
            <CardHeader>
              <CardTitle>开始PK对战</CardTitle>
              <CardDescription>选择PK模式并设置参数</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* PK 模式选择 */}
              <Tabs value={mode} onValueChange={value => setMode(value as PKMode)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="RANDOM">随机PK</TabsTrigger>
                  <TabsTrigger value="INDIVIDUAL">个人PK</TabsTrigger>
                  <TabsTrigger value="GROUP">分组PK</TabsTrigger>
                </TabsList>

                <TabsContent value="RANDOM" className="space-y-4">
                  <p className="text-muted-foreground text-sm">系统将随机选择2名学生进行PK对战</p>
                </TabsContent>

                <TabsContent value="INDIVIDUAL" className="space-y-4">
                  <p className="text-muted-foreground text-sm">
                    手动选择2名学生进行1v1对战 (功能开发中...)
                  </p>
                </TabsContent>

                <TabsContent value="GROUP" className="space-y-4">
                  <p className="text-muted-foreground text-sm">
                    选择2个分组进行团队对战 (功能开发中...)
                  </p>
                </TabsContent>
              </Tabs>

              {/* 奖励积分 */}
              <div className="space-y-2">
                <Label>奖励积分</Label>
                <Select value={rewardPoints} onValueChange={setRewardPoints}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">不设奖励</SelectItem>
                    <SelectItem value="5">5 积分</SelectItem>
                    <SelectItem value="10">10 积分</SelectItem>
                    <SelectItem value="15">15 积分</SelectItem>
                    <SelectItem value="20">20 积分</SelectItem>
                    <SelectItem value="30">30 积分</SelectItem>
                    <SelectItem value="50">50 积分</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-xs">胜利方将获得相应积分奖励</p>
              </div>

              {/* 开始按钮 */}
              <div className="border-primary/20 from-primary/5 to-background flex min-h-[200px] flex-col items-center justify-center rounded-lg border-2 border-dashed bg-gradient-to-br">
                <AnimatePresence mode="wait">
                  {isStarting ? (
                    <motion.div
                      key="starting"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex flex-col items-center gap-4"
                    >
                      <Loader2 className="text-primary h-16 w-16 animate-spin" />
                      <p className="text-muted-foreground animate-pulse text-lg">正在匹配对手...</p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="ready"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <Button onClick={handleStartPK} size="lg" disabled={isStarting}>
                        <Swords className="mr-2 h-5 w-5" />
                        开始PK
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        )
      )}
    </div>
  )
}
