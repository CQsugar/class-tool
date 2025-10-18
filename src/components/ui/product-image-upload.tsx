/**
 * 商品图片上传组件
 * 支持上传文件和直接输入URL
 * 延迟上传：选择文件后仅显示预览，点击保存时才上传
 */

'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ImageIcon, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface ProductImageUploadProps {
  value?: string | File | null
  onChange: (url: string | File) => void // 支持传递 File 对象或 URL 字符串
  disabled?: boolean
  label?: string
}

export function ProductImageUpload({
  value,
  onChange,
  disabled,
  label = '商品图片',
}: ProductImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [urlInput, setUrlInput] = useState('')
  const [pendingFile, setPendingFile] = useState<File | null>(null)

  // 同步外部 value 到内部状态
  useEffect(() => {
    if (typeof value === 'string') {
      setPreview(value || null)
      setUrlInput(value || '')
      setPendingFile(null)
    } else if (value instanceof File) {
      // 如果传入的是 File 对象，创建预览
      const reader = new FileReader()
      reader.onload = e => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(value)
      setPendingFile(value)
      setUrlInput('')
    }
  }, [value])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件')
      return
    }

    // 验证文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过5MB')
      return
    }

    // 创建预览（不上传）
    const reader = new FileReader()
    reader.onload = e => {
      const previewUrl = e.target?.result as string
      setPreview(previewUrl)
      setUrlInput('') // 清空 URL 输入
    }
    reader.readAsDataURL(file)

    // 保存文件对象，等待表单提交时上传
    setPendingFile(file)
    onChange(file) // 传递 File 对象给父组件
  }

  const handleUrlChange = (url: string) => {
    setUrlInput(url)
    setPreview(url)
    setPendingFile(null) // 清除待上传文件
    onChange(url) // 传递 URL 字符串给父组件
  }

  const handleRemove = () => {
    setPreview(null)
    setUrlInput('')
    setPendingFile(null)
    onChange('')
  }

  return (
    <div className="space-y-4">
      {label && <Label>{label}</Label>}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {/* 图片预览 */}
        <div className="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
          {preview ? (
            <img src={preview} alt="商品图片" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ImageIcon className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* 上传/URL输入 */}
        <div className="flex-1 space-y-3">
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">上传文件</TabsTrigger>
              <TabsTrigger value="url">输入URL</TabsTrigger>
            </TabsList>

            {/* 上传文件 */}
            <TabsContent value="upload" className="space-y-2">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                  onClick={() => document.getElementById('product-image-upload')?.click()}
                  className="flex-1"
                >
                  <ImageIcon className="mr-2 h-4 w-4" />
                  {preview && pendingFile ? '更换文件' : preview ? '更换图片' : '选择文件'}
                </Button>

                {preview && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={disabled}
                    onClick={handleRemove}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {pendingFile
                  ? `已选择: ${pendingFile.name} (点击保存后上传)`
                  : '支持 JPG、PNG、GIF 格式，大小不超过 5MB'}
              </p>
            </TabsContent>

            {/* 输入URL */}
            <TabsContent value="url" className="space-y-2">
              <div className="flex gap-2">
                <Input
                  type="url"
                  placeholder="https://example.com/product.jpg"
                  value={urlInput}
                  onChange={e => handleUrlChange(e.target.value)}
                  disabled={disabled}
                  className="flex-1"
                />
                {urlInput && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={disabled}
                    onClick={handleRemove}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                输入图片的完整URL地址，或使用本地路径（如 /uploads/...）
              </p>
            </TabsContent>
          </Tabs>
        </div>

        {/* 隐藏的文件输入 */}
        <input
          id="product-image-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={disabled}
        />
      </div>
    </div>
  )
}

/**
 * 上传文件到服务器的辅助函数
 * 供父组件在提交表单时调用
 */
export async function uploadProductImage(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('/api/upload?type=product', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || '上传失败')
  }

  const data = await response.json()
  return data.url
}
