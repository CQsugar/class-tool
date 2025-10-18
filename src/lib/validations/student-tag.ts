import { z } from 'zod'

// 标签基础Schema
export const studentTagSchema = z.object({
  name: z.string().min(1, '标签名称不能为空').max(20, '标签名称不能超过20个字符'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, '颜色必须是有效的十六进制格式'),
})

// 创建标签Schema
export const createStudentTagSchema = studentTagSchema

// 更新标签Schema
export const updateStudentTagSchema = studentTagSchema.partial()

// 查询标签Schema
export const studentTagQuerySchema = z.object({
  page: z.preprocess(
    val => (val === null || val === undefined || val === '' ? '1' : val),
    z.coerce.number().int().positive()
  ),
  pageSize: z.preprocess(
    val => (val === null || val === undefined || val === '' ? '50' : val),
    z.coerce.number().int().positive().max(100)
  ),
  search: z.preprocess(
    val => (val === null || val === undefined || val === '' ? undefined : val),
    z.string().optional()
  ),
})

// 添加学生到标签Schema
export const addStudentsToTagSchema = z.object({
  tagId: z.string().min(1, '标签ID不能为空'),
  studentIds: z.array(z.string()).min(1, '至少选择一个学生').max(100, '一次最多添加100个学生'),
})

// 从标签移除学生Schema
export const removeStudentsFromTagSchema = z.object({
  tagId: z.string().min(1, '标签ID不能为空'),
  studentIds: z.array(z.string()).min(1, '至少选择一个学生').max(100, '一次最多移除100个学生'),
})

// 批量添加标签到学生Schema
export const addTagsToStudentsSchema = z.object({
  studentIds: z.array(z.string()).min(1, '至少选择一个学生').max(100, '一次最多操作100个学生'),
  tagIds: z.array(z.string()).min(1, '至少选择一个标签').max(20, '一次最多添加20个标签'),
})

// 批量移除学生的标签Schema
export const removeTagsFromStudentsSchema = z.object({
  studentIds: z.array(z.string()).min(1, '至少选择一个学生').max(100, '一次最多操作100个学生'),
  tagIds: z.array(z.string()).min(1, '至少选择一个标签').max(20, '一次最多移除20个标签'),
})

// 按标签筛选学生Schema
export const filterStudentsByTagsSchema = z.object({
  tagIds: z.array(z.string()).min(1, '至少选择一个标签').max(10, '一次最多筛选10个标签'),
  matchMode: z.preprocess(
    val => (val === null || val === undefined || val === '' ? 'any' : val),
    z.enum(['any', 'all'])
  ),
  page: z.preprocess(
    val => (val === null || val === undefined || val === '' ? '1' : val),
    z.coerce.number().int().positive()
  ),
  pageSize: z.preprocess(
    val => (val === null || val === undefined || val === '' ? '50' : val),
    z.coerce.number().int().positive().max(100)
  ),
})

// TypeScript类型导出
export type StudentTagInput = z.infer<typeof studentTagSchema>
export type CreateStudentTagInput = z.infer<typeof createStudentTagSchema>
export type UpdateStudentTagInput = z.infer<typeof updateStudentTagSchema>
export type StudentTagQueryInput = z.infer<typeof studentTagQuerySchema>
export type AddStudentsToTagInput = z.infer<typeof addStudentsToTagSchema>
export type RemoveStudentsFromTagInput = z.infer<typeof removeStudentsFromTagSchema>
export type AddTagsToStudentsInput = z.infer<typeof addTagsToStudentsSchema>
export type RemoveTagsFromStudentsInput = z.infer<typeof removeTagsFromStudentsSchema>
export type FilterStudentsByTagsInput = z.infer<typeof filterStudentsByTagsSchema>
