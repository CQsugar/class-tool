import { NextRequest, NextResponse } from 'next/server'

import {
  getTemplatesByCategory,
  getTemplatesByType,
  POINT_RULE_TEMPLATES,
  searchTemplates,
  TEMPLATE_CATEGORIES,
} from '@/lib/constants/point-rule-templates'

/**
 * GET /api/points/templates - 获取积分规则模板
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const type = searchParams.get('type')
    const search = searchParams.get('search')
    const includeCategories = searchParams.get('includeCategories') === 'true'

    let templates = POINT_RULE_TEMPLATES

    // 按分类筛选
    if (category) {
      templates = getTemplatesByCategory(category)
    }

    // 按类型筛选
    if (type && (type === 'ADD' || type === 'SUBTRACT')) {
      templates = getTemplatesByType(type)
    }

    // 搜索
    if (search) {
      templates = searchTemplates(search)
    }

    const response: {
      templates: typeof templates
      categories?: typeof TEMPLATE_CATEGORIES
    } = {
      templates,
    }

    // 可选包含分类信息
    if (includeCategories) {
      response.categories = TEMPLATE_CATEGORIES
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Failed to get templates:', error)
    return NextResponse.json({ error: '获取模板失败' }, { status: 500 })
  }
}
