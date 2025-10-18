/**
 * 静态文件服务API
 * GET /api/uploads/[...path]
 */

import fs from 'fs/promises'
import { NextRequest, NextResponse } from 'next/server'
import path from 'path'

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const { path: filePath } = await params

    // 构建文件路径
    const fullPath = path.join(process.cwd(), UPLOAD_DIR, ...filePath)

    // 安全检查:确保文件在上传目录内
    const uploadDirAbsolute = path.join(process.cwd(), UPLOAD_DIR)
    if (!fullPath.startsWith(uploadDirAbsolute)) {
      return NextResponse.json({ error: '非法路径' }, { status: 403 })
    }

    // 读取文件
    const file = await fs.readFile(fullPath)

    // 获取文件扩展名并设置Content-Type
    const ext = path.extname(fullPath).toLowerCase()
    const contentType = getContentType(ext)

    // 返回文件
    return new NextResponse(file as unknown as BodyInit, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('读取文件失败:', error)
    return NextResponse.json({ error: '文件不存在' }, { status: 404 })
  }
}

/**
 * 根据文件扩展名获取Content-Type
 */
function getContentType(ext: string): string {
  const types: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.xls': 'application/vnd.ms-excel',
  }

  return types[ext] || 'application/octet-stream'
}
