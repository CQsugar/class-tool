import { z } from 'zod'

/**
 * 归档类型枚举
 */
export const ArchiveTypeEnum = z.enum([
  'STUDENT',
  'POINT_RECORD',
  'REDEMPTION',
  'POINT_RULE',
  'STORE_ITEM',
  'STUDENT_GROUP',
  'PK_SESSION',
])

/**
 * 创建归档记录的schema
 */
export const createArchiveSchema = z.object({
  type: ArchiveTypeEnum,
  reason: z.string().optional(),
  description: z.string().max(500).optional(),
  itemIds: z.array(z.string()).min(1, '至少需要选择一项进行归档'),
})

export type CreateArchiveInput = z.infer<typeof createArchiveSchema>

/**
 * 查询归档列表的schema
 */
export const listArchivesSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  type: ArchiveTypeEnum.optional(),
  search: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
})

export type ListArchivesInput = z.infer<typeof listArchivesSchema>

/**
 * 恢复归档的schema
 */
export const restoreArchiveSchema = z.object({
  archiveId: z.string(),
  itemIds: z.array(z.string()).optional(), // 如果为空则恢复所有项
})

export type RestoreArchiveInput = z.infer<typeof restoreArchiveSchema>

/**
 * 批量归档学生的schema
 */
export const batchArchiveStudentsSchema = z.object({
  studentIds: z.array(z.string()).min(1),
  reason: z.string().optional(),
  description: z.string().max(500).optional(),
})

export type BatchArchiveStudentsInput = z.infer<typeof batchArchiveStudentsSchema>

/**
 * 归档积分记录的schema (按时间范围)
 */
export const archivePointRecordsSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  reason: z.string().optional(),
  description: z.string().max(500).optional(),
})

export type ArchivePointRecordsInput = z.infer<typeof archivePointRecordsSchema>

/**
 * 归档兑换记录的schema (按时间范围)
 */
export const archiveRedemptionsSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  status: z.enum(['PENDING', 'FULFILLED', 'CANCELLED']).optional(),
  reason: z.string().optional(),
  description: z.string().max(500).optional(),
})

export type ArchiveRedemptionsInput = z.infer<typeof archiveRedemptionsSchema>
