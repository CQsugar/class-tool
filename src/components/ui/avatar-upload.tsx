/**
 * 头像上传组件
 * 支持拖拽、预览、裁剪
 */

'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Camera, Loader2, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface AvatarUploadProps {
  value?: string
  onChange: (url: string) => void
  disabled?: boolean
}

export function AvatarUpload({ value, onChange, disabled }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(value || null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件')
      return
    }

    // 验证文件大小 (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('图片大小不能超过2MB')
      return
    }

    // 创建预览
    const reader = new FileReader()
    reader.onload = e => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // 上传文件
    try {
      setUploading(true)

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload?type=avatar', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '上传失败')
      }

      const data = await response.json()
      onChange(data.url)
      toast.success('头像上传成功')
    } catch (error) {
      console.error('上传失败:', error)
      toast.error(error instanceof Error ? error.message : '上传失败')
      setPreview(value || null) // 恢复原值
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    onChange('')
    toast.success('头像已移除')
  }

  return (
    <div className="space-y-4">
      <Label>学生头像</Label>

      <div className="flex items-center gap-4">
        {/* 头像预览 */}
        <Avatar className="h-20 w-20">
          <AvatarImage src={preview || undefined} alt="头像预览" />
          <AvatarFallback>
            <Camera className="h-8 w-8 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>

        {/* 操作按钮 */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            {/* 上传按钮 */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || uploading}
              onClick={() => document.getElementById('avatar-upload')?.click()}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  上传中...
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-4 w-4" />
                  {preview ? '更换头像' : '上传头像'}
                </>
              )}
            </Button>

            {/* 删除按钮 */}
            {preview && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled || uploading}
                onClick={handleRemove}
              >
                <X className="mr-2 h-4 w-4" />
                移除
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            支持 JPG、PNG、GIF 格式，大小不超过 2MB
          </p>
        </div>

        {/* 隐藏的文件输入 */}
        <input
          id="avatar-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={disabled || uploading}
        />
      </div>
    </div>
  )
}
