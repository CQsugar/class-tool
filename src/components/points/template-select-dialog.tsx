'use client'

import { PointType } from '@prisma/client'
import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PointRuleTemplate, TemplateCategory } from '@/lib/constants/point-rule-templates'
import { cn } from '@/lib/utils'

interface TemplateSelectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (template: PointRuleTemplate) => void
}

export function TemplateSelectDialog({ open, onOpenChange, onSelect }: TemplateSelectDialogProps) {
  const [templates, setTemplates] = useState<PointRuleTemplate[]>([])
  const [categories, setCategories] = useState<TemplateCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')

  useEffect(() => {
    if (open) {
      loadTemplates()
    }
  }, [open])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/points/templates?includeCategories=true')
      if (!response.ok) throw new Error('加载模板失败')

      const data = await response.json()
      setTemplates(data.templates || [])
      setCategories(data.categories || [])
    } catch (error) {
      console.error('Failed to load templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredTemplates = templates.filter(template => {
    // 分类筛选
    if (activeCategory !== 'all' && template.category !== activeCategory) {
      return false
    }

    // 搜索筛选
    if (search) {
      const lowerSearch = search.toLowerCase()
      return (
        template.name.toLowerCase().includes(lowerSearch) ||
        template.description?.toLowerCase().includes(lowerSearch)
      )
    }

    return true
  })

  const handleSelect = (template: PointRuleTemplate) => {
    onSelect(template)
    onOpenChange(false)
    setSearch('')
    setActiveCategory('all')
  }

  const getTypeText = (type: PointType) => {
    return type === PointType.ADD ? '+' : '-'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col">
        <DialogHeader>
          <DialogTitle>选择规则模板</DialogTitle>
          <DialogDescription>从预设模板快速创建积分规则</DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-hidden">
          {/* 搜索框 */}
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="搜索模板..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* 分类标签页 */}
          <Tabs value={activeCategory} onValueChange={setActiveCategory} className="flex flex-col">
            <TabsList className="w-full flex-shrink-0 justify-start overflow-x-auto">
              <TabsTrigger value="all">全部</TabsTrigger>
              {categories.map(category => (
                <TabsTrigger key={category.id} value={category.id}>
                  <span className="mr-1">{category.icon}</span>
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={activeCategory} className="mt-4 flex-1 overflow-hidden">
              {loading ? (
                <div className="flex h-64 items-center justify-center">
                  <div className="text-muted-foreground">加载中...</div>
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className="flex h-64 items-center justify-center">
                  <div className="text-muted-foreground text-center">
                    <p>未找到匹配的模板</p>
                    <p className="text-sm">尝试调整搜索关键词或选择其他分类</p>
                  </div>
                </div>
              ) : (
                <ScrollArea className="h-[450px]">
                  <div className="grid gap-2 pr-4 sm:grid-cols-2">
                    {filteredTemplates.map(template => (
                      <button
                        key={template.id}
                        type="button"
                        className="hover:border-primary group relative flex items-start gap-3 rounded-lg border p-3 text-left transition-all hover:shadow-md"
                        onClick={() => handleSelect(template)}
                      >
                        {template.icon && (
                          <span className="shrink-0 text-2xl leading-none">{template.icon}</span>
                        )}
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="truncate font-medium">{template.name}</h4>
                          </div>
                          {template.description && (
                            <p className="text-muted-foreground line-clamp-2 text-xs">
                              {template.description}
                            </p>
                          )}
                        </div>
                        <Badge
                          variant="secondary"
                          className={cn(
                            'shrink-0',
                            template.type === PointType.ADD
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          )}
                        >
                          {getTypeText(template.type)}
                          {Math.abs(template.points)}
                        </Badge>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
