import { PointType } from '@prisma/client'
import { z } from 'zod'

/**
 * 积分记录基础 schema
 */
export const pointRecordSchema = z.object({
  points: z.number().int().min(-1000).max(1000),
  reason: z.string().min(1, '原因不能为空').max(200, '原因不能超过200字'),
  type: z.nativeEnum(PointType),
  studentId: z.string().cuid(),
  ruleId: z.string().cuid().optional().nullable(),
})

/**
 * 快速加减分输入 schema
 */
export const quickPointsSchema = z.object({
  studentIds: z.array(z.string().cuid()).min(1, '请至少选择一个学生'),
  ruleId: z.string().cuid().optional().nullable(),
  points: z.number().int().min(-1000).max(1000),
  reason: z.string().min(1, '原因不能为空').max(200, '原因不能超过200字'),
  type: z.nativeEnum(PointType),
})

/**
 * 使用规则快速加减分 schema
 */
export const applyRuleSchema = z.object({
  studentIds: z.array(z.string().cuid()).min(1, '请至少选择一个学生'),
  ruleId: z.string().cuid(),
})

/**
 * 积分记录查询 schema
 */
export const pointRecordQuerySchema = z.object({
  page: z.preprocess(
    val => (val === null || val === undefined || val === '' ? '1' : val),
    z.coerce.number().int().positive()
  ),
  limit: z.preprocess(
    val => (val === null || val === undefined || val === '' ? '20' : val),
    z.coerce.number().int().positive().max(100)
  ),
  studentId: z.preprocess(
    val => (val === null || val === undefined || val === '' ? undefined : val),
    z.string().cuid().optional()
  ),
  type: z.preprocess(
    val => (val === null || val === undefined || val === '' ? undefined : val),
    z.nativeEnum(PointType).optional()
  ),
  startDate: z.preprocess(
    val => (val === null || val === undefined || val === '' ? undefined : val),
    z.string().datetime().optional()
  ),
  endDate: z.preprocess(
    val => (val === null || val === undefined || val === '' ? undefined : val),
    z.string().datetime().optional()
  ),
  search: z.preprocess(
    val => (val === null || val === undefined || val === '' ? undefined : val),
    z.string().optional()
  ),
})

// TypeScript 类型导出
export type PointRecordInput = z.infer<typeof pointRecordSchema>
export type QuickPointsInput = z.infer<typeof quickPointsSchema>
export type ApplyRuleInput = z.infer<typeof applyRuleSchema>
export type PointRecordQueryInput = z.infer<typeof pointRecordQuerySchema>
