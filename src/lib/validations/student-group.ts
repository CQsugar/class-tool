import { z } from 'zod'

/**
 * 学生分组基础 schema
 */
export const studentGroupSchema = z.object({
  name: z.string().min(1, '分组名称不能为空').max(50, '分组名称不能超过50字'),
  description: z.string().max(200, '描述不能超过200字').optional().nullable(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, '颜色格式不正确')
    .optional()
    .nullable(),
})

/**
 * 创建分组 schema
 */
export const createStudentGroupSchema = studentGroupSchema.extend({
  memberIds: z.array(z.string().cuid()).default([]),
})

/**
 * 更新分组 schema
 */
export const updateStudentGroupSchema = studentGroupSchema.partial()

/**
 * 分组查询 schema
 */
export const studentGroupQuerySchema = z.object({
  page: z.preprocess(
    val => (val === null || val === undefined || val === '' ? '1' : val),
    z.coerce.number().int().positive()
  ),
  pageSize: z.preprocess(
    val => (val === null || val === undefined || val === '' ? '20' : val),
    z.coerce.number().int().positive().max(100)
  ),
  search: z.preprocess(
    val => (val === null || val === undefined || val === '' ? undefined : val),
    z.string().optional()
  ),
  isArchived: z.preprocess(val => {
    if (val === null || val === undefined || val === '') return undefined
    if (val === 'true') return true
    if (val === 'false') return false
    return val
  }, z.boolean().optional()),
})

/**
 * 批量添加成员 schema
 */
export const addMembersSchema = z.object({
  groupId: z.string().cuid(),
  studentIds: z.array(z.string().cuid()).min(1, '请至少选择一个学生'),
})

/**
 * 批量移除成员 schema
 */
export const removeMembersSchema = z.object({
  groupId: z.string().cuid(),
  studentIds: z.array(z.string().cuid()).min(1, '请至少选择一个学生'),
})

/**
 * 批量归档/取消归档 schema
 */
export const toggleArchiveGroupsSchema = z.object({
  groupIds: z.array(z.string().cuid()).min(1, '请至少选择一个分组'),
  isArchived: z.boolean(),
})

// TypeScript 类型导出
export type StudentGroupInput = z.infer<typeof studentGroupSchema>
export type CreateStudentGroupInput = z.infer<typeof createStudentGroupSchema>
export type UpdateStudentGroupInput = z.infer<typeof updateStudentGroupSchema>
export type StudentGroupQueryInput = z.infer<typeof studentGroupQuerySchema>
export type AddMembersInput = z.infer<typeof addMembersSchema>
export type RemoveMembersInput = z.infer<typeof removeMembersSchema>
export type ToggleArchiveGroupsInput = z.infer<typeof toggleArchiveGroupsSchema>
