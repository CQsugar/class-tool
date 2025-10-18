/**
 * 文件上传API
 * POST /api/upload
 */

import { auth } from '@/lib/auth'
import { storageManager } from '@/lib/upload'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * 上传文件
 */
export async function POST(req: NextRequest) {
  try {
    // 验证用户身份
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    // 获取上传类型
    const url = new URL(req.url)
    const type = url.searchParams.get('type') || 'file'

    // 解析form-data
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: '未找到文件' }, { status: 400 })
    }

    // 验证文件
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: '仅支持图片文件' }, { status: 400 })
    }

    // 根据类型上传
    let url_path: string
    if (type === 'avatar') {
      url_path = await storageManager.uploadAvatar(file)
    } else {
      url_path = await storageManager.uploadFile(file)
    }

    // 生成完整URL
    const publicUrl = storageManager.getPublicUrl(url_path)

    return NextResponse.json({
      url: publicUrl,
      filename: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error('文件上传失败:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '文件上传失败',
      },
      { status: 500 }
    )
  }
}
