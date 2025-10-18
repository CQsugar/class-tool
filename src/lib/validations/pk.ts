import { z } from 'zod'

// PK 模式枚举
export const pkModeSchema = z.enum(['INDIVIDUAL', 'GROUP', 'RANDOM'])

// PK 状态枚举
export const pkStatusSchema = z.enum(['ONGOING', 'FINISHED', 'CANCELLED'])

// 创建 PK 会话
export const createPKSessionSchema = z.object({
  mode: pkModeSchema,
  topic: z.string().max(200).optional(),
  rewardPoints: z.number().int().min(0).max(1000).default(0),
  duration: z.number().int().min(1).max(3600).optional(), // 最长60分钟
  // INDIVIDUAL 模式: 传入2个学生ID
  studentIds: z.array(z.string()).min(2).max(2).optional(),
  // GROUP 模式: 传入2个分组ID
  groupIds: z.array(z.string()).min(2).max(2).optional(),
  // RANDOM 模式: 不需要传参,自动随机选择2个学生
})

// 更新 PK 会话
export const updatePKSessionSchema = z.object({
  winnerId: z.string().optional(),
  winnerType: z.enum(['STUDENT', 'GROUP']).optional(),
  status: pkStatusSchema.optional(),
})

// 查询 PK 会话列表
export const getPKSessionsSchema = z.object({
  mode: pkModeSchema.optional(),
  status: pkStatusSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

// 参与者类型
export type PKMode = z.infer<typeof pkModeSchema>
export type PKStatus = z.infer<typeof pkStatusSchema>
export type CreatePKSessionInput = z.infer<typeof createPKSessionSchema>
export type UpdatePKSessionInput = z.infer<typeof updatePKSessionSchema>
export type GetPKSessionsInput = z.infer<typeof getPKSessionsSchema>
