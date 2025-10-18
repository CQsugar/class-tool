import { Gender } from '@prisma/client'
import { z } from 'zod'

/**
 * 学生信息验证Schema
 */
export const studentSchema = z.object({
  name: z.string().min(1, '姓名不能为空').max(50, '姓名不能超过50个字符'),
  studentNo: z
    .string()
    .min(1, '学号不能为空')
    .max(20, '学号不能超过20个字符')
    .regex(/^[a-zA-Z0-9]+$/, '学号只能包含字母和数字'),
  gender: z.nativeEnum(Gender, {
    message: '性别必须是 MALE 或 FEMALE',
  }),
  phone: z
    .string()
    .regex(/^1[3-9]\d{9}$/, '请输入有效的手机号码')
    .optional()
    .or(z.literal('')),
  parentPhone: z
    .string()
    .regex(/^1[3-9]\d{9}$/, '请输入有效的家长手机号码')
    .optional()
    .or(z.literal('')),
  avatar: z.string().url('请输入有效的头像URL').optional().or(z.literal('')),
  notes: z.string().max(500, '备注不能超过500个字符').optional(),
})

/**
 * 创建学生输入验证Schema
 */
export const createStudentSchema = studentSchema

/**
 * 更新学生输入验证Schema（所有字段可选）
 */
export const updateStudentSchema = studentSchema.partial()

/**
 * 学生查询参数验证Schema
 */
export const studentQuerySchema = z.object({
  page: z.preprocess(
    val => (val === null || val === undefined || val === '' ? '1' : val),
    z.coerce.number().int().positive()
  ),
  limit: z.preprocess(
    val => (val === null || val === undefined || val === '' ? '20' : val),
    z.coerce.number().int().positive().max(100)
  ),
  search: z.preprocess(
    val => (val === null || val === '' ? undefined : val),
    z.string().optional()
  ),
  gender: z.preprocess(
    val => (val === null || val === '' ? undefined : val),
    z.nativeEnum(Gender).optional()
  ),
  isArchived: z.preprocess(val => (val === null || val === '' ? 'false' : val), z.coerce.boolean()),
  sortBy: z.preprocess(
    val => (val === null || val === '' ? 'points' : val),
    z.enum(['name', 'studentNo', 'points', 'createdAt', 'updatedAt'])
  ),
  sortOrder: z.preprocess(
    val => (val === null || val === '' ? 'desc' : val),
    z.enum(['asc', 'desc'])
  ),
})

/**
 * 批量操作验证Schema
 */
export const batchStudentSchema = z.object({
  studentIds: z.array(z.string().cuid()).min(1, '至少选择一个学生'),
})

/**
 * 学生归档验证Schema
 */
export const archiveStudentSchema = z.object({
  studentIds: z.array(z.string().cuid()).min(1, '至少选择一个学生'),
  isArchived: z.boolean(),
})

/**
 * 导入学生验证Schema
 */
export const importStudentSchema = z.array(
  z.object({
    name: z.string().min(1),
    studentNo: z.string().min(1),
    gender: z.nativeEnum(Gender),
    phone: z.string().optional(),
    parentPhone: z.string().optional(),
    notes: z.string().optional(),
  })
)

/**
 * 类型推导
 */
export type StudentInput = z.infer<typeof studentSchema>
export type CreateStudentInput = z.infer<typeof createStudentSchema>
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>
export type StudentQueryInput = z.infer<typeof studentQuerySchema>
export type BatchStudentInput = z.infer<typeof batchStudentSchema>
export type ArchiveStudentInput = z.infer<typeof archiveStudentSchema>
export type ImportStudentInput = z.infer<typeof importStudentSchema>
