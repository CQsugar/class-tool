import { Metadata } from 'next'
import { Users, Trophy, Phone, TrendingUp, Plus, Zap, Target, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export const metadata: Metadata = {
  title: '仪表板 - 班级管理平台',
  description: '班级管理平台仪表板概览',
}

export default function DashboardPage() {
  return (
    <>
      {/* Main content */}
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Welcome section */}
        <div className="space-y-2">
          <p className="text-muted-foreground">欢迎回来！查看您的班级管理概况</p>
        </div>

        {/* Statistics cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">学生总数</CardTitle>
              <Users className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">42</div>
              <p className="text-muted-foreground text-xs">比上月增加 +2</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总积分</CardTitle>
              <Trophy className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,250</div>
              <p className="text-muted-foreground text-xs">本周增加 +180</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">今日点名</CardTitle>
              <Phone className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-muted-foreground text-xs">已点名 8/42 人</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">活跃度</CardTitle>
              <TrendingUp className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">85%</div>
              <p className="text-muted-foreground text-xs">比上周提升 +5%</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick actions */}
        <Card>
          <CardHeader>
            <CardTitle>快速操作</CardTitle>
            <CardDescription>常用功能快速入口</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Button variant="outline" className="h-20 flex-col gap-2">
                <Plus className="h-6 w-6" />
                <span>添加学生</span>
              </Button>

              <Button variant="outline" className="h-20 flex-col gap-2">
                <Zap className="h-6 w-6" />
                <span>记录积分</span>
              </Button>

              <Button variant="outline" className="h-20 flex-col gap-2">
                <Phone className="h-6 w-6" />
                <span>随机点名</span>
              </Button>

              <Button variant="outline" className="h-20 flex-col gap-2">
                <Target className="h-6 w-6" />
                <span>开始PK</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent activities and overview */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>最近活动</CardTitle>
              <CardDescription>班级最新动态</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">李小明获得了5积分</p>
                    <p className="text-muted-foreground text-xs">课堂发言积极 • 2分钟前</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">王小红兑换了笔记本</p>
                    <p className="text-muted-foreground text-xs">消费20积分 • 15分钟前</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 rounded-full bg-yellow-500" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">随机点名：张小强</p>
                    <p className="text-muted-foreground text-xs">数学课 • 30分钟前</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>本周统计</CardTitle>
              <CardDescription>关键指标总览</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="text-muted-foreground h-4 w-4" />
                    <span className="text-sm">积分发放</span>
                  </div>
                  <span className="text-sm font-medium">+180</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Trophy className="text-muted-foreground h-4 w-4" />
                    <span className="text-sm">积分兑换</span>
                  </div>
                  <span className="text-sm font-medium">-85</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Phone className="text-muted-foreground h-4 w-4" />
                    <span className="text-sm">点名次数</span>
                  </div>
                  <span className="text-sm font-medium">24</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Target className="text-muted-foreground h-4 w-4" />
                    <span className="text-sm">PK对战</span>
                  </div>
                  <span className="text-sm font-medium">12</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
