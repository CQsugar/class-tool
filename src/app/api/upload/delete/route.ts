/**
 * 文件删除API
 * DELETE /api/upload/delete
 */

import { auth } from '@/lib/auth'
import { storageManager } from '@/lib/upload'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * 删除文件
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

    // 获取要删除的文件URL
    const { url } = await req.json()

    if (!url) {
      return NextResponse.json({ error: '缺少URL参数' }, { status: 400 })
    }

    // 验证URL格式 - 只允许删除本地上传的文件
    if (!url.startsWith('/uploads/')) {
      return NextResponse.json({ error: '无效的URL' }, { status: 400 })
    }

    // 从URL中提取文件路径
    // 例如: /uploads/avatars/xxx.jpg -> /avatars/xxx.jpg
    const filePath = url.replace('/uploads', '')

    // 删除文件
    await storageManager.deleteFile(filePath)

    return NextResponse.json({
      success: true,
      message: '文件已删除',
    })
  } catch (error) {
    console.error('文件删除失败:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '文件删除失败',
      },
      { status: 500 }
    )
  }
}
