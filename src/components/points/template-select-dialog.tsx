'use client'

import { PointType } from '@prisma/client'
import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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

  const getTypeColor = (type: PointType) => {
    return type === PointType.ADD ? 'bg-green-500/10 text-green-700' : 'bg-red-500/10 text-red-700'
  }

  const getTypeText = (type: PointType) => {
    return type === PointType.ADD ? '+' : '-'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-3xl">
        <DialogHeader>
          <DialogTitle>选择规则模板</DialogTitle>
          <DialogDescription>从预设模板快速创建积分规则</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
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
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="all">全部</TabsTrigger>
              {categories.map(category => (
                <TabsTrigger key={category.id} value={category.id}>
                  <span className="mr-1">{category.icon}</span>
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={activeCategory} className="mt-4">
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
                <ScrollArea className="h-[400px] pr-4">
                  <div className="grid gap-3">
                    {filteredTemplates.map(template => (
                      <div
                        key={template.id}
                        className="group hover:border-primary relative cursor-pointer rounded-lg border p-4 transition-all hover:shadow-sm"
                        onClick={() => handleSelect(template)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              {template.icon && <span className="text-xl">{template.icon}</span>}
                              <h4 className="font-medium">{template.name}</h4>
                              <Badge variant="secondary" className={getTypeColor(template.type)}>
                                {getTypeText(template.type)}
                                {Math.abs(template.points)}分
                              </Badge>
                            </div>
                            {template.description && (
                              <p className="text-muted-foreground text-sm">
                                {template.description}
                              </p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="opacity-0 transition-opacity group-hover:opacity-100"
                            onClick={e => {
                              e.stopPropagation()
                              handleSelect(template)
                            }}
                          >
                            选择
                          </Button>
                        </div>
                      </div>
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
