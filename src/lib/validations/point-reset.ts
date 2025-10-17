import { z } from 'zod'

// 积分重置模式
export enum ResetMode {
  ALL = 'all', // 重置所有学生
  GROUP = 'group', // 按分组重置
  TAG = 'tag', // 按标签重置
  SELECTED = 'selected', // 重置选中的学生
}

// 积分重置Schema
export const resetPointsSchema = z.object({
  mode: z.nativeEnum(ResetMode),
  targetValue: z.number().int('目标积分必须是整数'),
  groupId: z.string().optional(),
  tagId: z.string().optional(),
  studentIds: z.array(z.string()).optional(),
  confirmText: z
    .string()
    .min(1, '请输入确认文本')
    .refine(val => val === '确认重置', '请输入正确的确认文本'),
})

// 批量重置积分Schema（用于验证请求）
export const batchResetPointsSchema = resetPointsSchema.refine(
  data => {
    // 根据不同模式验证必需字段
    if (data.mode === ResetMode.GROUP && !data.groupId) {
      return false
    }
    if (data.mode === ResetMode.TAG && !data.tagId) {
      return false
    }
    if (data.mode === ResetMode.SELECTED && (!data.studentIds || data.studentIds.length === 0)) {
      return false
    }
    return true
  },
  {
    message: '请提供必需的参数',
    path: ['mode'],
  }
)

// TypeScript类型导出
export type ResetPointsInput = z.infer<typeof resetPointsSchema>
export type BatchResetPointsInput = z.infer<typeof batchResetPointsSchema>
