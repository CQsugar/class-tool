import { ItemType } from '@prisma/client'
import { z } from 'zod'

/**
 * 商品类型验证Schema
 */
export const createStoreItemSchema = z.object({
  name: z.string().min(1, '商品名称不能为空').max(100, '商品名称不能超过100个字符'),
  description: z.string().max(500, '商品描述不能超过500个字符').optional(),
  cost: z.number().int('积分必须是整数').min(1, '积分必须大于0'),
  image: z.string().url('请输入有效的图片URL').optional().or(z.literal('')),
  type: z.nativeEnum(ItemType),
  stock: z.number().int('库存必须是整数').min(0, '库存不能为负数').nullable().optional(),
  sortOrder: z.number().int('排序必须是整数').default(0),
  isActive: z.boolean().default(true),
})

export const updateStoreItemSchema = createStoreItemSchema.partial()

export type CreateStoreItemInput = z.infer<typeof createStoreItemSchema>
export type UpdateStoreItemInput = z.infer<typeof updateStoreItemSchema>

/**
 * 兑换验证Schema
 */
export const createRedemptionSchema = z.object({
  itemId: z.string().min(1, '商品ID不能为空'),
  studentId: z.string().min(1, '学生ID不能为空'),
  notes: z.string().max(500, '备注不能超过500个字符').optional(),
})

export const updateRedemptionStatusSchema = z.object({
  status: z.enum(['PENDING', 'FULFILLED', 'CANCELLED']),
  notes: z.string().max(500, '备注不能超过500个字符').optional(),
})

export type CreateRedemptionInput = z.infer<typeof createRedemptionSchema>
export type UpdateRedemptionStatusInput = z.infer<typeof updateRedemptionStatusSchema>

/**
 * 批量兑换Schema
 */
export const batchRedemptionSchema = z.object({
  itemId: z.string().min(1, '商品ID不能为空'),
  studentIds: z.array(z.string()).min(1, '至少选择一个学生'),
  notes: z.string().max(500, '备注不能超过500个字符').optional(),
})

export type BatchRedemptionInput = z.infer<typeof batchRedemptionSchema>
