'use client'

import { Palette } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

// 预设颜色
const PRESET_COLORS = [
  { name: '红色', value: '#ef4444' },
  { name: '橙色', value: '#f97316' },
  { name: '琥珀', value: '#f59e0b' },
  { name: '黄色', value: '#eab308' },
  { name: '青柠', value: '#84cc16' },
  { name: '绿色', value: '#22c55e' },
  { name: '翡翠', value: '#10b981' },
  { name: '蓝绿', value: '#14b8a6' },
  { name: '青色', value: '#06b6d4' },
  { name: '天蓝', value: '#0ea5e9' },
  { name: '蓝色', value: '#3b82f6' },
  { name: '靛蓝', value: '#6366f1' },
  { name: '紫色', value: '#8b5cf6' },
  { name: '深紫', value: '#a855f7' },
  { name: '品红', value: '#d946ef' },
  { name: '粉红', value: '#ec4899' },
]

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  className?: string
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  const [inputValue, setInputValue] = React.useState(value)
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    setInputValue(value)
  }, [value])

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue)
    // 验证颜色格式
    if (/^#[0-9A-F]{6}$/i.test(newValue)) {
      onChange(newValue)
    }
  }

  const handleInputBlur = () => {
    // 如果格式不正确，恢复为当前值
    if (!/^#[0-9A-F]{6}$/i.test(inputValue)) {
      setInputValue(value)
    }
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* 颜色预览和触发器 */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="h-10 w-full justify-start gap-2 px-3"
            type="button"
          >
            <div
              className="h-6 w-6 rounded border-2 border-border"
              style={{ backgroundColor: value }}
            />
            <span className="flex-1 text-left font-mono text-sm">{value.toUpperCase()}</span>
            <Palette className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-4">
            {/* 预设颜色 */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">预设颜色</Label>
              <div className="grid grid-cols-8 gap-2">
                {PRESET_COLORS.map(color => (
                  <button
                    key={color.value}
                    type="button"
                    title={color.name}
                    onClick={() => {
                      onChange(color.value)
                      setOpen(false)
                    }}
                    className={cn(
                      'h-8 w-8 rounded-md border-2 transition-all hover:scale-110',
                      value === color.value
                        ? 'ring-primary border-primary ring-2 ring-offset-2'
                        : 'border-transparent'
                    )}
                    style={{ backgroundColor: color.value }}
                  />
                ))}
              </div>
            </div>

            {/* 自定义颜色 */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">自定义颜色</Label>
              <div className="flex gap-2">
                {/* HTML5 颜色选择器 */}
                <div className="relative">
                  <input
                    type="color"
                    value={value}
                    onChange={e => {
                      onChange(e.target.value)
                    }}
                    className="h-10 w-14 cursor-pointer rounded border border-input"
                  />
                </div>

                {/* 十六进制输入 */}
                <Input
                  type="text"
                  value={inputValue}
                  onChange={e => handleInputChange(e.target.value)}
                  onBlur={handleInputBlur}
                  placeholder="#000000"
                  className="flex-1 font-mono uppercase"
                  maxLength={7}
                />
              </div>
              <p className="text-muted-foreground text-xs">
                支持十六进制颜色代码 (如: #FF5733)
              </p>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
