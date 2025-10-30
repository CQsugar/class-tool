'use client'

import { ItemType } from '@prisma/client'
import { Check, Crown, Gift, Loader2, Package, Search, ShoppingCart, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface Student {
  id: string
  name: string
  studentNo: string
  points: number
  avatar: string | null
}

interface StoreItem {
  id: string
  name: string
  description: string | null
  cost: number
  image: string | null
  type: ItemType
  stock: number | null
  isActive: boolean
}

const TYPE_ICONS = {
  VIRTUAL: Package,
  PHYSICAL: Gift,
  PRIVILEGE: Crown,
}

const TYPE_LABELS = {
  VIRTUAL: '虚拟奖励',
  PHYSICAL: '实物奖励',
  PRIVILEGE: '特权奖励',
}

const TYPE_COLORS = {
  VIRTUAL: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  PHYSICAL: 'bg-green-500/10 text-green-700 border-green-500/20',
  PRIVILEGE: 'bg-purple-500/10 text-purple-700 border-purple-500/20',
}

export default function RedeemPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [items, setItems] = useState<StoreItem[]>([])
  const [filteredItems, setFilteredItems] = useState<StoreItem[]>([])
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [redeeming, setRedeeming] = useState(false)
  const [open, setOpen] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // 加载学生列表
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await fetch('/api/students?limit=1000&isArchived=false')
        if (!response.ok) throw new Error('Failed to fetch students')
        const data = await response.json()
        setStudents(data.data || [])
      } catch (error) {
        console.error('Failed to fetch students:', error)
        toast.error('加载学生列表失败')
      }
    }

    fetchStudents()
  }, [])

  // 加载商品列表
  const fetchItems = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/store/items?limit=100&isActive=true')
      if (!response.ok) throw new Error('Failed to fetch items')
      const data = await response.json()
      setItems(data.items || [])
      setFilteredItems(data.items || [])
    } catch (error) {
      console.error('Failed to fetch items:', error)
      toast.error('加载商品列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  // 搜索商品
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setFilteredItems(items)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = items.filter(
      item =>
        item.name.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query))
    )
    setFilteredItems(filtered)
  }

  // 重置搜索
  const handleResetSearch = () => {
    setSearchQuery('')
    setFilteredItems(items)
  }

  // 处理兑换
  const handleRedeem = async () => {
    if (!selectedStudent || !selectedItem) return

    setRedeeming(true)
    try {
      const response = await fetch('/api/store/redemptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          itemId: selectedItem.id,
          notes: notes.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '兑换失败')
      }

      const result = await response.json()
      toast.success(`兑换成功！${selectedStudent.name} 兑换了 ${selectedItem.name}`)

      // 更新学生积分（同时更新选中学生和学生列表）
      const updatedPoints = result.redemption.student.points
      setSelectedStudent(prev => (prev ? { ...prev, points: updatedPoints } : null))
      setStudents(prev =>
        prev.map(student =>
          student.id === selectedStudent.id ? { ...student, points: updatedPoints } : student
        )
      )

      // 更新商品库存（同时更新items和filteredItems）
      if (selectedItem.stock !== null) {
        const updateStock = (itemList: StoreItem[]) =>
          itemList.map(item =>
            item.id === selectedItem.id && item.stock !== null
              ? { ...item, stock: item.stock - 1 }
              : item
          )

        setItems(updateStock)
        setFilteredItems(updateStock)
      }

      // 重置表单
      setNotes('')
      setConfirmDialogOpen(false)
      setSelectedItem(null)
    } catch (error) {
      console.error('Redemption failed:', error)
      const errorMessage = error instanceof Error ? error.message : '兑换失败'
      toast.error(errorMessage)

      // 如果是库存相关错误，刷新商品列表以获取最新库存
      if (
        errorMessage.includes('库存') ||
        errorMessage.includes('无货') ||
        errorMessage.includes('stock') ||
        errorMessage.includes('insufficient')
      ) {
        toast.info('正在刷新商品信息...')
        await fetchItems()
      }

      // 关闭对话框
      setConfirmDialogOpen(false)
      setSelectedItem(null)
    } finally {
      setRedeeming(false)
    }
  }

  // 打开兑换确认对话框
  const openRedeemDialog = (item: StoreItem) => {
    if (!selectedStudent) {
      toast.warning('请先选择学生')
      return
    }

    if (selectedStudent.points < item.cost) {
      toast.error(`积分不足！需要 ${item.cost} 分，当前只有 ${selectedStudent.points} 分`)
      return
    }

    if (item.stock !== null && item.stock < 1) {
      toast.error('商品库存不足')
      return
    }

    setSelectedItem(item)
    setConfirmDialogOpen(true)
  }

  // 过滤可兑换的商品（根据学生积分）
  const affordableItems = filteredItems.filter(
    item => !selectedStudent || selectedStudent.points >= item.cost
  )
  const unaffordableItems = filteredItems.filter(
    item => selectedStudent && selectedStudent.points < item.cost
  )

  return (
    <div className="flex flex-1 flex-col gap-4 p-2 pt-0 sm:gap-6 sm:p-4 sm:pt-0">
      {/* 页面标题 */}
      <div className="space-y-1 sm:space-y-2">
        <h1 className="text-2xl font-bold sm:text-3xl">商品兑换</h1>
        <p className="text-muted-foreground text-sm sm:text-base">为学生兑换积分商品</p>
      </div>

      {/* 学生选择区域 */}
      <Card>
        <CardHeader>
          <CardTitle>选择学生</CardTitle>
          <CardDescription>请选择要兑换商品的学生</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 学生选择器 */}
            <div className="space-y-2">
              <Label>学生</Label>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                  >
                    {selectedStudent ? (
                      <span className="flex items-center gap-2">
                        {selectedStudent.name} ({selectedStudent.studentNo})
                      </span>
                    ) : (
                      <span className="text-muted-foreground">搜索并选择学生...</span>
                    )}
                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="搜索学生姓名或学号..." />
                    <CommandList>
                      <CommandEmpty>未找到学生</CommandEmpty>
                      <CommandGroup>
                        {students.map(student => (
                          <CommandItem
                            key={student.id}
                            value={`${student.name} ${student.studentNo}`}
                            onSelect={() => {
                              setSelectedStudent(student)
                              setOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                selectedStudent?.id === student.id ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            <div className="flex flex-1 items-center justify-between">
                              <span>
                                {student.name} ({student.studentNo})
                              </span>
                              <Badge variant="secondary">{student.points} 分</Badge>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* 学生信息展示 - 紧凑现代化卡片 */}
            {selectedStudent && (
              <Card className="border-primary/30 from-primary/5 via-primary/3 to-background bg-gradient-to-br shadow-sm">
                <CardContent>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    {/* 学生信息 */}
                    <div className="flex items-center gap-3">
                      {/* 头像 - 缩小 */}
                      <div className="relative">
                        <div className="bg-primary/10 ring-primary/20 flex h-12 w-12 items-center justify-center rounded-full ring-2">
                          {selectedStudent.avatar ? (
                            <img
                              src={selectedStudent.avatar}
                              alt={selectedStudent.name}
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-primary text-xl font-bold">
                              {selectedStudent.name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="bg-primary absolute -right-0.5 -bottom-0.5 flex h-5 w-5 items-center justify-center rounded-full shadow-md">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      </div>

                      {/* 姓名和学号 - 缩小字体 */}
                      <div className="space-y-0.5">
                        <h3 className="text-base font-semibold">{selectedStudent.name}</h3>
                        <Badge variant="outline" className="font-mono text-xs">
                          {selectedStudent.studentNo}
                        </Badge>
                      </div>
                    </div>

                    {/* 积分信息 - 紧凑版 */}
                    <div className="border-primary/20 bg-background/50 flex items-center gap-2 rounded-xl border px-4 py-2 backdrop-blur-sm">
                      <div className="flex items-baseline gap-1">
                        <span className="text-primary text-2xl font-bold tracking-tight">
                          {selectedStudent.points}
                        </span>
                        <span className="text-muted-foreground text-xs font-medium">积分</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 商品列表区域 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-bold">可兑换商品</h2>
          {selectedStudent && (
            <Badge variant="outline" className="text-sm">
              共 {filteredItems.length} 件商品
            </Badge>
          )}
        </div>

        {/* 搜索框 */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="搜索商品名称或描述..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  handleSearch()
                }
              }}
              className="pl-9"
            />
          </div>
          <Button onClick={handleSearch} variant="default">
            <Search className="mr-2 h-4 w-4" />
            搜索
          </Button>
          {searchQuery && (
            <Button onClick={handleResetSearch} variant="outline">
              <X className="mr-2 h-4 w-4" />
              清除
            </Button>
          )}
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="mb-4 h-48 w-full" />
                  <Skeleton className="mb-2 h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="text-muted-foreground mb-4 h-12 w-12" />
              <p className="text-muted-foreground mb-2 text-lg font-medium">
                {searchQuery ? '未找到匹配的商品' : '暂无可兑换商品'}
              </p>
              <p className="text-muted-foreground text-sm">
                {searchQuery ? '尝试使用其他关键词搜索' : '请先在商品管理中添加商品'}
              </p>
              {searchQuery && (
                <Button onClick={handleResetSearch} variant="outline" className="mt-4">
                  清除搜索
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* 可兑换商品 */}
            {affordableItems.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {affordableItems.map(item => {
                  const isOutOfStock = item.stock !== null && item.stock < 1
                  const getInitial = (name: string) => name.charAt(0).toUpperCase()
                  const Icon = TYPE_ICONS[item.type]

                  return (
                    <Card
                      key={item.id}
                      className={cn('transition-all hover:shadow-md', isOutOfStock && 'opacity-60')}
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                          {/* 图片 */}
                          <div className="relative flex-shrink-0">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-20 w-20 rounded-md object-cover"
                              />
                            ) : (
                              <div className="bg-primary/10 text-primary flex h-20 w-20 items-center justify-center rounded-md text-2xl font-bold">
                                {getInitial(item.name)}
                              </div>
                            )}
                            {isOutOfStock && (
                              <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/50">
                                <Badge variant="destructive" className="text-xs">
                                  无货
                                </Badge>
                              </div>
                            )}
                          </div>

                          {/* 内容 */}
                          <div className="flex min-h-0 flex-1 flex-col space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="leading-tight font-semibold">{item.name}</h3>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <Badge
                                variant="outline"
                                className={cn('gap-1', TYPE_COLORS[item.type])}
                              >
                                <Icon className="h-3 w-3" />
                                {TYPE_LABELS[item.type]}
                              </Badge>
                              <span className="text-primary text-sm font-bold">
                                {item.cost} 积分
                              </span>
                            </div>

                            {/* 描述 - 固定高度 */}
                            <div className="min-h-[2.5rem]">
                              {item.description && (
                                <p className="text-muted-foreground line-clamp-2 text-sm">
                                  {item.description}
                                </p>
                              )}
                            </div>

                            {/* 库存信息 - 固定高度避免布局不一致 */}
                            <div className="text-muted-foreground flex min-h-[1.25rem] flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                              {item.stock !== null && <span>库存: {item.stock}</span>}
                            </div>

                            {/* 兑换按钮 */}
                            <Button
                              className="w-full sm:w-auto sm:self-start"
                              size="sm"
                              onClick={() => openRedeemDialog(item)}
                              disabled={!selectedStudent || isOutOfStock}
                            >
                              <ShoppingCart className="mr-2 h-4 w-4" />
                              立即兑换
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

            {/* 积分不足的商品 */}
            {selectedStudent && unaffordableItems.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="bg-border h-px flex-1" />
                  <span className="text-muted-foreground text-sm">积分不足的商品</span>
                  <div className="bg-border h-px flex-1" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {unaffordableItems.map(item => {
                    const getInitial = (name: string) => name.charAt(0).toUpperCase()
                    const Icon = TYPE_ICONS[item.type]

                    return (
                      <Card key={item.id} className="opacity-50">
                        <CardContent className="p-4">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                            {/* 图片 */}
                            <div className="flex-shrink-0">
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="h-20 w-20 rounded-md object-cover"
                                />
                              ) : (
                                <div className="bg-primary/10 text-primary flex h-20 w-20 items-center justify-center rounded-md text-2xl font-bold">
                                  {getInitial(item.name)}
                                </div>
                              )}
                            </div>

                            {/* 内容 */}
                            <div className="flex min-h-0 flex-1 flex-col space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="leading-tight font-semibold">{item.name}</h3>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className={cn('gap-1', TYPE_COLORS[item.type])}
                                >
                                  <Icon className="h-3 w-3" />
                                  {TYPE_LABELS[item.type]}
                                </Badge>
                                <span className="text-primary text-sm font-bold">
                                  {item.cost} 积分
                                </span>
                              </div>

                              {/* 描述 - 固定高度 */}
                              <div className="min-h-[2.5rem]">
                                {item.description && (
                                  <p className="text-muted-foreground line-clamp-2 text-sm">
                                    {item.description}
                                  </p>
                                )}
                              </div>

                              {/* 库存信息占位 - 固定高度保持一致 */}
                              <div className="min-h-[1.25rem]"></div>

                              {/* 禁用按钮 */}
                              <Button className="w-full sm:w-auto sm:self-start" size="sm" disabled>
                                积分不足
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 兑换确认对话框 */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认兑换</DialogTitle>
            <DialogDescription>请确认以下兑换信息</DialogDescription>
          </DialogHeader>

          {selectedStudent && selectedItem && (
            <div className="space-y-4">
              {/* 学生信息 */}
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground mb-1 text-sm">学生</p>
                <p className="font-medium">
                  {selectedStudent.name} ({selectedStudent.studentNo})
                </p>
                <p className="text-muted-foreground text-sm">
                  当前积分: {selectedStudent.points} 分
                </p>
              </div>

              {/* 商品信息 */}
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground mb-1 text-sm">兑换商品</p>
                <div className="flex items-center gap-3">
                  {selectedItem.image && (
                    <img
                      src={selectedItem.image}
                      alt={selectedItem.name}
                      className="h-12 w-12 rounded object-cover"
                    />
                  )}
                  <div>
                    <p className="font-medium">{selectedItem.name}</p>
                    <p className="text-primary text-sm font-semibold">{selectedItem.cost} 积分</p>
                  </div>
                </div>
              </div>

              {/* 兑换后积分 */}
              <div className="border-primary/20 bg-primary/5 rounded-lg border-2 p-3">
                <p className="text-muted-foreground mb-1 text-sm">兑换后积分</p>
                <p className="text-primary text-2xl font-bold">
                  {selectedStudent.points - selectedItem.cost} 分
                </p>
              </div>

              {/* 备注 */}
              <div className="space-y-2">
                <Label htmlFor="notes">备注（可选）</Label>
                <Textarea
                  id="notes"
                  placeholder="输入兑换备注..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              取消
            </Button>
            <Button onClick={handleRedeem} disabled={redeeming}>
              {redeeming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  兑换中...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  确认兑换
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
