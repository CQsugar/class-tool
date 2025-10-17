import { PointType } from '@prisma/client'
import { z } from 'zod'

/**
 * 积分规则验证Schema
 */
export const pointRuleSchema = z.object({
  name: z.string().min(1, '规则名称不能为空').max(50, '规则名称不能超过50个字符'),
  points: z
    .number()
    .int('积分必须是整数')
    .min(-1000, '积分不能低于-1000')
    .max(1000, '积分不能超过1000'),
  type: z.nativeEnum(PointType, {
    message: '类型必须是 ADD、SUBTRACT 或 RESET',
  }),
  category: z.string().max(30, '分类不能超过30个字符').optional().or(z.literal('')),
  description: z.string().max(200, '描述不能超过200个字符').optional().or(z.literal('')),
  isActive: z.boolean().default(true),
})

/**
 * 创建积分规则输入验证Schema
 */
export const createPointRuleSchema = pointRuleSchema

/**
 * 更新积分规则输入验证Schema（所有字段可选）
 */
export const updatePointRuleSchema = pointRuleSchema.partial()

/**
 * 积分规则查询参数验证Schema
 */
export const pointRuleQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  type: z.nativeEnum(PointType).optional(),
  category: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  sortBy: z.enum(['name', 'points', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

/**
 * 批量操作验证Schema
 */
export const batchPointRuleSchema = z.object({
  ruleIds: z.array(z.string().cuid()).min(1, '至少选择一个规则'),
})

/**
 * 批量激活/停用验证Schema
 */
export const togglePointRuleSchema = z.object({
  ruleIds: z.array(z.string().cuid()).min(1, '至少选择一个规则'),
  isActive: z.boolean(),
})

/**
 * 类型推导
 */
export type PointRuleInput = z.infer<typeof pointRuleSchema>
export type CreatePointRuleInput = z.infer<typeof createPointRuleSchema>
export type UpdatePointRuleInput = z.infer<typeof updatePointRuleSchema>
export type PointRuleQueryInput = z.infer<typeof pointRuleQuerySchema>
export type BatchPointRuleInput = z.infer<typeof batchPointRuleSchema>
export type TogglePointRuleInput = z.infer<typeof togglePointRuleSchema>
