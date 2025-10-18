/**
 * 文件上传工具函数
 * 支持本地存储,预留OSS接口
 */

import { randomUUID } from 'crypto'
import fs from 'fs/promises'
import path from 'path'
import sharp from 'sharp'

// 上传配置
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads'
const MAX_FILE_SIZE = parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '10') * 1024 * 1024 // MB to bytes
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

// 头像配置
const AVATAR_MAX_SIZE = 2 * 1024 * 1024 // 2MB
const AVATAR_DIMENSIONS = {
  width: 200,
  height: 200,
}

/**
 * 文件存储策略接口
 * 方便后期切换到OSS
 */
export interface StorageStrategy {
  save(file: File, options?: SaveOptions): Promise<string>
  delete(url: string): Promise<void>
  getPublicUrl(filename: string): string
}

export interface SaveOptions {
  folder?: string
  resize?: { width: number; height: number }
  quality?: number
}

/**
 * 本地文件存储策略
 */
export class LocalStorageStrategy implements StorageStrategy {
  private uploadDir: string

  constructor(uploadDir: string = UPLOAD_DIR) {
    this.uploadDir = uploadDir
  }

  /**
   * 保存文件到本地
   */
  async save(file: File, options: SaveOptions = {}): Promise<string> {
    const { folder = 'images', resize, quality = 80 } = options

    // 验证文件
    this.validateFile(file)

    // 创建上传目录
    const targetDir = path.join(this.uploadDir, folder)
    await fs.mkdir(targetDir, { recursive: true })

    // 生成唯一文件名
    const ext = path.extname(file.name)
    const filename = `${randomUUID()}${ext}`
    const filePath = path.join(targetDir, filename)

    // 读取文件内容
    const buffer = Buffer.from(await file.arrayBuffer())

    // 如果需要调整大小(用于图片)
    if (resize && this.isImage(file.type)) {
      const resizedBuffer = await sharp(buffer)
        .resize(resize.width, resize.height, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality })
        .toBuffer()

      await fs.writeFile(filePath, resizedBuffer)
    } else {
      await fs.writeFile(filePath, buffer)
    }

    // 返回相对路径
    return `/${folder}/${filename}`
  }

  /**
   * 删除文件
   */
  async delete(url: string): Promise<void> {
    try {
      // 从URL提取文件路径
      const filePath = path.join(this.uploadDir, url)
      await fs.unlink(filePath)
    } catch (error) {
      console.error('删除文件失败:', error)
      // 不抛出错误,因为文件可能已经不存在
    }
  }

  /**
   * 获取公开访问URL
   */
  getPublicUrl(filename: string): string {
    return `/uploads${filename}`
  }

  /**
   * 验证文件
   */
  private validateFile(file: File): void {
    // 检查文件大小
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`文件大小超过限制 (${MAX_FILE_SIZE / 1024 / 1024}MB)`)
    }

    // 检查文件类型
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new Error('不支持的文件类型')
    }
  }

  /**
   * 判断是否为图片
   */
  private isImage(mimeType: string): boolean {
    return ALLOWED_IMAGE_TYPES.includes(mimeType)
  }
}

/**
 * OSS存储策略(预留接口)
 * 后期可以实现阿里云OSS、腾讯云COS、AWS S3等
 */
export class OSSStorageStrategy implements StorageStrategy {
  private bucket: string
  private region: string

  constructor(bucket: string, region: string) {
    this.bucket = bucket
    this.region = region
  }

  async save(_file: File, _options?: SaveOptions): Promise<string> {
    // TODO: 实现OSS上传
    throw new Error('OSS存储策略尚未实现')
  }

  async delete(_url: string): Promise<void> {
    // TODO: 实现OSS删除
    throw new Error('OSS存储策略尚未实现')
  }

  getPublicUrl(filename: string): string {
    // TODO: 返回OSS公开URL
    return `https://${this.bucket}.${this.region}.aliyuncs.com${filename}`
  }
}

/**
 * 存储管理器
 * 根据环境变量选择存储策略
 */
export class StorageManager {
  private strategy: StorageStrategy

  constructor() {
    // 默认使用本地存储
    // 后期可以根据环境变量切换到OSS
    const storageType = process.env.STORAGE_TYPE || 'local'

    if (storageType === 'oss') {
      const bucket = process.env.OSS_BUCKET || ''
      const region = process.env.OSS_REGION || ''
      this.strategy = new OSSStorageStrategy(bucket, region)
    } else {
      this.strategy = new LocalStorageStrategy()
    }
  }

  /**
   * 上传头像
   */
  async uploadAvatar(file: File): Promise<string> {
    // 验证头像大小
    if (file.size > AVATAR_MAX_SIZE) {
      throw new Error('头像大小不能超过2MB')
    }

    // 保存并调整大小
    return await this.strategy.save(file, {
      folder: 'avatars',
      resize: AVATAR_DIMENSIONS,
      quality: 85,
    })
  }

  /**
   * 上传普通文件
   */
  async uploadFile(file: File, folder: string = 'files'): Promise<string> {
    return await this.strategy.save(file, { folder })
  }

  /**
   * 删除文件
   */
  async deleteFile(url: string): Promise<void> {
    return await this.strategy.delete(url)
  }

  /**
   * 获取公开URL
   */
  getPublicUrl(filename: string): string {
    return this.strategy.getPublicUrl(filename)
  }
}

// 导出单例
export const storageManager = new StorageManager()
