/**
 * 积分规则模板系统
 * 提供常用的规则模板，方便用户快速创建规则
 */

import { PointType } from '@prisma/client'

export interface PointRuleTemplate {
  id: string
  name: string
  points: number
  type: PointType
  category: string
  description?: string
  icon?: string
}

export interface TemplateCategory {
  id: string
  name: string
  description: string
  icon?: string
}

/**
 * 模板分类
 */
export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  {
    id: 'learning',
    name: '学习表现',
    description: '与学习相关的积分规则',
    icon: '📚',
  },
  {
    id: 'behavior',
    name: '行为规范',
    description: '与课堂纪律、行为习惯相关的规则',
    icon: '🎯',
  },
  {
    id: 'activity',
    name: '活动参与',
    description: '与班级活动、集体任务相关的规则',
    icon: '🎉',
  },
  {
    id: 'hygiene',
    name: '卫生值日',
    description: '与清洁卫生、值日工作相关的规则',
    icon: '🧹',
  },
  {
    id: 'help',
    name: '互助合作',
    description: '与帮助他人、团队合作相关的规则',
    icon: '🤝',
  },
]

/**
 * 系统内置规则模板
 */
export const POINT_RULE_TEMPLATES: PointRuleTemplate[] = [
  // 学习表现 - 加分项
  {
    id: 'homework_complete',
    name: '作业完成',
    points: 2,
    type: PointType.ADD,
    category: 'learning',
    description: '按时完成作业',
    icon: '✅',
  },
  {
    id: 'homework_excellent',
    name: '作业优秀',
    points: 5,
    type: PointType.ADD,
    category: 'learning',
    description: '作业质量优秀，获得表扬',
    icon: '⭐',
  },
  {
    id: 'exam_progress',
    name: '考试进步',
    points: 10,
    type: PointType.ADD,
    category: 'learning',
    description: '考试成绩有明显进步',
    icon: '📈',
  },
  {
    id: 'class_active',
    name: '课堂积极发言',
    points: 3,
    type: PointType.ADD,
    category: 'learning',
    description: '主动举手回答问题',
    icon: '🙋',
  },
  {
    id: 'answer_correct',
    name: '回答正确',
    points: 2,
    type: PointType.ADD,
    category: 'learning',
    description: '正确回答老师提问',
    icon: '💯',
  },
  {
    id: 'reading_task',
    name: '完成阅读任务',
    points: 3,
    type: PointType.ADD,
    category: 'learning',
    description: '完成课外阅读并记录',
    icon: '📖',
  },

  // 学习表现 - 扣分项
  {
    id: 'homework_missing',
    name: '作业未交',
    points: -3,
    type: PointType.SUBTRACT,
    category: 'learning',
    description: '未按时提交作业',
    icon: '❌',
  },
  {
    id: 'homework_careless',
    name: '作业潦草',
    points: -2,
    type: PointType.SUBTRACT,
    category: 'learning',
    description: '作业书写不认真',
    icon: '📝',
  },

  // 行为规范 - 加分项
  {
    id: 'punctual',
    name: '按时到校',
    points: 1,
    type: PointType.ADD,
    category: 'behavior',
    description: '准时到校，不迟到',
    icon: '⏰',
  },
  {
    id: 'discipline_good',
    name: '课堂纪律良好',
    points: 2,
    type: PointType.ADD,
    category: 'behavior',
    description: '遵守课堂纪律，认真听讲',
    icon: '👂',
  },
  {
    id: 'polite',
    name: '礼貌待人',
    points: 2,
    type: PointType.ADD,
    category: 'behavior',
    description: '对老师同学有礼貌',
    icon: '🙏',
  },

  // 行为规范 - 扣分项
  {
    id: 'late',
    name: '迟到',
    points: -2,
    type: PointType.SUBTRACT,
    category: 'behavior',
    description: '上课迟到',
    icon: '⏰',
  },
  {
    id: 'absent',
    name: '缺勤',
    points: -5,
    type: PointType.SUBTRACT,
    category: 'behavior',
    description: '无故缺勤',
    icon: '🚫',
  },
  {
    id: 'disrupt',
    name: '课堂违纪',
    points: -3,
    type: PointType.SUBTRACT,
    category: 'behavior',
    description: '扰乱课堂秩序',
    icon: '🔇',
  },
  {
    id: 'phone_use',
    name: '违规使用手机',
    points: -5,
    type: PointType.SUBTRACT,
    category: 'behavior',
    description: '上课时间使用手机',
    icon: '📱',
  },

  // 活动参与 - 加分项
  {
    id: 'activity_join',
    name: '积极参与活动',
    points: 5,
    type: PointType.ADD,
    category: 'activity',
    description: '主动参加班级活动',
    icon: '🎊',
  },
  {
    id: 'competition_join',
    name: '参加竞赛',
    points: 10,
    type: PointType.ADD,
    category: 'activity',
    description: '代表班级参加竞赛',
    icon: '🏆',
  },
  {
    id: 'competition_win',
    name: '竞赛获奖',
    points: 20,
    type: PointType.ADD,
    category: 'activity',
    description: '在竞赛中获得奖项',
    icon: '🥇',
  },
  {
    id: 'volunteer',
    name: '志愿服务',
    points: 8,
    type: PointType.ADD,
    category: 'activity',
    description: '参与志愿服务活动',
    icon: '💝',
  },

  // 卫生值日 - 加分项
  {
    id: 'duty_complete',
    name: '值日完成',
    points: 3,
    type: PointType.ADD,
    category: 'hygiene',
    description: '认真完成值日工作',
    icon: '✨',
  },
  {
    id: 'desk_clean',
    name: '桌面整洁',
    points: 1,
    type: PointType.ADD,
    category: 'hygiene',
    description: '保持桌面整洁',
    icon: '🪑',
  },

  // 卫生值日 - 扣分项
  {
    id: 'duty_missing',
    name: '值日未完成',
    points: -3,
    type: PointType.SUBTRACT,
    category: 'hygiene',
    description: '未完成值日任务',
    icon: '🚫',
  },
  {
    id: 'desk_messy',
    name: '桌面杂乱',
    points: -1,
    type: PointType.SUBTRACT,
    category: 'hygiene',
    description: '桌面物品摆放杂乱',
    icon: '📦',
  },

  // 互助合作 - 加分项
  {
    id: 'help_others',
    name: '帮助同学',
    points: 3,
    type: PointType.ADD,
    category: 'help',
    description: '主动帮助有困难的同学',
    icon: '🫶',
  },
  {
    id: 'team_work',
    name: '团队合作',
    points: 5,
    type: PointType.ADD,
    category: 'help',
    description: '在小组活动中表现突出',
    icon: '👥',
  },
  {
    id: 'share',
    name: '分享知识',
    points: 4,
    type: PointType.ADD,
    category: 'help',
    description: '与同学分享学习经验',
    icon: '💡',
  },
]

/**
 * 根据分类获取模板
 */
export function getTemplatesByCategory(categoryId: string): PointRuleTemplate[] {
  return POINT_RULE_TEMPLATES.filter(template => template.category === categoryId)
}

/**
 * 根据类型获取模板
 */
export function getTemplatesByType(type: PointType): PointRuleTemplate[] {
  return POINT_RULE_TEMPLATES.filter(template => template.type === type)
}

/**
 * 根据ID获取模板
 */
export function getTemplateById(id: string): PointRuleTemplate | undefined {
  return POINT_RULE_TEMPLATES.find(template => template.id === id)
}

/**
 * 搜索模板
 */
export function searchTemplates(query: string): PointRuleTemplate[] {
  const lowerQuery = query.toLowerCase()
  return POINT_RULE_TEMPLATES.filter(
    template =>
      template.name.toLowerCase().includes(lowerQuery) ||
      template.description?.toLowerCase().includes(lowerQuery)
  )
}
