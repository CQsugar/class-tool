'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ItemType } from '@prisma/client'
import { toast } from 'sonner'
import { X } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import {
  createStoreItemSchema,
  updateStoreItemSchema,
  type CreateStoreItemInput,
  type UpdateStoreItemInput,
} from '@/lib/validations/store'

interface StoreItem {
  id: string
  name: string
  description: string | null
  cost: number
  image: string | null
  type: ItemType
  stock: number | null
  sortOrder: number
  isActive: boolean
}

interface StoreItemFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: StoreItem | null
  onSuccess?: () => void
}

export function StoreItemFormDialog({
  open,
  onOpenChange,
  item,
  onSuccess,
}: StoreItemFormDialogProps) {
  const isEdit = !!item
  const [loading, setLoading] = useState(false)
  const [useStock, setUseStock] = useState(item?.stock !== null)

  const form = useForm<CreateStoreItemInput | UpdateStoreItemInput>({
    resolver: zodResolver(isEdit ? updateStoreItemSchema : createStoreItemSchema),
    defaultValues: item
      ? {
          name: item.name,
          description: item.description || '',
          cost: item.cost,
          image: item.image || '',
          type: item.type,
          stock: item.stock,
          sortOrder: item.sortOrder,
          isActive: item.isActive,
        }
      : {
          name: '',
          description: '',
          cost: 10,
          image: '',
          type: ItemType.VIRTUAL,
          stock: null,
          sortOrder: 0,
          isActive: true,
        },
  })

  useEffect(() => {
    if (open && item) {
      setUseStock(item.stock !== null)
      form.reset({
        name: item.name,
        description: item.description || '',
        cost: item.cost,
        image: item.image || '',
        type: item.type,
        stock: item.stock,
        sortOrder: item.sortOrder,
        isActive: item.isActive,
      })
    } else if (open && !item) {
      setUseStock(false)
      form.reset({
        name: '',
        description: '',
        cost: 10,
        image: '',
        type: ItemType.VIRTUAL,
        stock: null,
        sortOrder: 0,
        isActive: true,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item])

  const onSubmit = async (data: CreateStoreItemInput | UpdateStoreItemInput) => {
    try {
      setLoading(true)

      // 如果不使用库存管理，设置stock为null
      const submitData = {
        ...data,
        stock: useStock ? data.stock : null,
      }

      const url = isEdit ? `/api/store/items/${item.id}` : '/api/store/items'
      const method = isEdit ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '操作失败')
      }

      toast.success(isEdit ? '商品已更新' : '商品已添加')
      onOpenChange(false)
      form.reset()
      onSuccess?.()
    } catch (error) {
      console.error('提交表单失败:', error)
      toast.error(error instanceof Error ? error.message : '操作失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑商品' : '添加商品'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '修改商品信息。点击保存以更新。' : '创建新的商品。带 * 的字段为必填项。'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* 商品名称 */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>商品名称 *</FormLabel>
                  <FormControl>
                    <Input placeholder="请输入商品名称" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              {/* 商品类型 */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>商品类型 *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择类型" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="VIRTUAL">虚拟奖励</SelectItem>
                        <SelectItem value="PHYSICAL">实物奖励</SelectItem>
                        <SelectItem value="PRIVILEGE">特权奖励</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>虚拟奖励如免写券，实物如文具，特权如选座位</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 所需积分 */}
              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>所需积分 *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="请输入积分"
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 商品描述 */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>商品描述</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="请输入商品描述"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>最多500个字符</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 商品图片 */}
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>商品图片</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Input type="url" placeholder="https://example.com/image.jpg" {...field} />
                      {field.value && (
                        <div className="relative inline-block">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={field.value}
                            alt="商品预览"
                            className="h-32 w-32 rounded-md object-cover"
                            onError={e => {
                              e.currentTarget.src = ''
                              toast.error('图片加载失败，请检查URL')
                            }}
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6"
                            onClick={() => field.onChange('')}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>输入图片URL，留空使用默认图标</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 库存管理 */}
            <div className="space-y-4 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">启用库存管理</h4>
                  <p className="text-muted-foreground text-sm">关闭则商品数量无限制</p>
                </div>
                <Switch checked={useStock} onCheckedChange={setUseStock} />
              </div>

              {useStock && (
                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>库存数量</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="请输入库存数量"
                          {...field}
                          value={field.value ?? ''}
                          onChange={e => {
                            const value = e.target.value
                            field.onChange(value === '' ? null : parseInt(value))
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* 排序顺序 */}
              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>排序顺序</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>数字越小越靠前</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 是否上架 */}
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">立即上架</FormLabel>
                      <FormDescription>关闭后商品不会显示</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false)
                  form.reset()
                }}
                disabled={loading}
              >
                取消
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? '提交中...' : isEdit ? '保存' : '添加'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
