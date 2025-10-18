# 文件上传系统迁移文档

## 概述

本文档记录了文件上传系统从自定义 API 路由迁移到 Next.js 静态文件服务的过程。

## 迁移原因

1. **简化架构**：无需自定义 API 路由来提供文件访问
2. **性能优化**：利用 Next.js 内置的静态文件缓存机制
3. **减少维护**：移除了冗余的文件服务代码
4. **标准化**：遵循 Next.js 最佳实践

## 架构变化

### 旧架构（已废弃）

```
上传文件 → 保存到 ./uploads/
         ↓
访问路径: /uploads/files/xxx.jpg
         ↓
next.config.ts rewrites → /api/uploads/files/xxx.jpg
         ↓
API Route 读取文件 → 返回文件内容
```

**问题**：

- 需要维护自定义 API 路由
- 需要配置 URL 重写规则
- 无法使用 Next.js Image 优化功能

### 新架构（当前）

```
上传文件 → 保存到 ./public/uploads/
         ↓
访问路径: /uploads/files/xxx.jpg
         ↓
Next.js 自动提供静态文件服务
```

**优势**：

- 零配置，Next.js 自动处理
- 简化的代码结构
- 更好的性能和缓存

## 关键改动

### 1. 上传配置 (`src/lib/upload.ts`)

```typescript
// 之前
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads'

// 之后 - 固定为 public/uploads，不可通过环境变量修改
const UPLOAD_DIR = './public/uploads'
```

**重要说明**：

- ⚠️ `UPLOAD_DIR` 必须固定为 `./public/uploads`
- ⚠️ 只有 `public/` 目录下的文件才能被 Next.js 提供静态访问
- ⚠️ 不要通过环境变量修改此路径，否则文件将无法访问

### 2. 删除 API 路由 (`src/app/api/uploads/[...path]/route.ts`)

- **之前**：通过 API 路由手动读取和返回文件
- **之后**：Next.js 自动提供 `public/` 目录下的静态文件
- **操作**：删除整个 `/api/uploads` 路由目录

### 3. 移除 URL 重写规则 (`next.config.ts`)

```typescript
// 之前 - 需要重写规则将 /uploads 映射到 API 路由
export default {
  rewrites: async () => [
    {
      source: '/uploads/:path*',
      destination: '/api/uploads/:path*',
    },
  ],
}

// 之后 - 不再需要重写规则，Next.js 自动提供 public/ 下的文件
export default {
  // 只保留 images 配置
  images: {
    remotePatterns: [...]
  }
}
```

### 4. 使用原生 img 标签 (`src/components/**/*.tsx`)

```tsx
// 所有组件统一使用原生 img 标签
{
  item.image && (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={item.image} alt={item.name} className="h-20 w-20 rounded-md object-cover" />
  )
}
```

**为什么不使用 Next.js Image 组件？**

- Next.js 15 的 Image 优化器在处理本地上传文件时存在兼容性问题
- 使用原生 `<img>` 标签更简单可靠
- 对于用户上传的商品图片，不需要复杂的响应式优化
- 可以在未来需要时迁移到外部 CDN（如 Cloudinary）

### 5. Middleware 配置 (`src/middleware.ts`)

```typescript
// 添加 /uploads 路径到排除列表，允许静态文件访问
export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|uploads|favicon.ico).*)'],
}
```

**重要**：必须在 middleware 中排除 `/uploads` 路径，否则认证中间件会拦截静态文件访问。

### 6. 文件迁移

```bash
# 将现有文件从旧位置迁移到新位置
cp -r ./uploads/* ./public/uploads/

# 验证文件已正确迁移
ls -la public/uploads/files/
```

### 7. 更新 .gitignore

```gitignore
# 忽略上传的文件，但保留目录结构
/public/uploads/*
!/public/uploads/.gitkeep

# 旧上传目录（向后兼容）
/uploads/*
!/uploads/.gitkeep
```

## 迁移步骤

### 1. 更新上传配置

修改 `src/lib/upload.ts`，将 `UPLOAD_DIR` 改为 `./public/uploads`。

### 2. 删除 API 路由

删除 `src/app/api/uploads` 目录及其所有文件。

### 3. 简化 Next.js 配置

从 `next.config.ts` 中移除 `rewrites` 配置。

### 4. 更新 Middleware

在 `src/middleware.ts` 的 matcher 中添加 `uploads` 到排除列表。

### 5. 更新组件

将所有使用 Next.js `<Image>` 组件加载上传文件的地方改为原生 `<img>` 标签。

### 6. 迁移现有文件

```bash
# 创建新目录（如果不存在）
mkdir -p public/uploads/{avatars,files,images}

# 复制现有文件
cp -r uploads/* public/uploads/

# 验证迁移
ls -la public/uploads/
```

### 7. 更新 .gitignore

添加 `/public/uploads/*` 到 `.gitignore`。

### 8. 测试验证

1. 上传新文件，确认保存到正确位置
2. 访问现有文件，确认可以正常显示
3. 检查图片在各个页面的显示效果

## 文件路径对照

| 类型     | 物理路径                           | 访问 URL                   |
| -------- | ---------------------------------- | -------------------------- |
| 商品图片 | `./public/uploads/files/xxx.jpg`   | `/uploads/files/xxx.jpg`   |
| 学生头像 | `./public/uploads/avatars/xxx.jpg` | `/uploads/avatars/xxx.jpg` |
| 其他图片 | `./public/uploads/images/xxx.jpg`  | `/uploads/images/xxx.jpg`  |

## 注意事项

1. ⚠️ **不要修改 UPLOAD_DIR**：必须保持为 `./public/uploads`
2. ⚠️ **Middleware 配置**：必须排除 `/uploads` 路径
3. ⚠️ **URL 格式**：数据库中存储的路径应该是 `/uploads/xxx`，不包含 `public` 前缀
4. ⚠️ **Git 忽略**：确保 `.gitignore` 正确配置，避免提交上传的文件

## 回滚方案

如果迁移后出现问题，可以按以下步骤回滚：

1. 恢复 `src/app/api/uploads/[...path]/route.ts`
2. 恢复 `next.config.ts` 中的 `rewrites` 配置
3. 将 `UPLOAD_DIR` 改回 `./uploads`
4. 从 middleware matcher 中移除 `uploads`
5. 将文件复制回 `./uploads` 目录

## 未来改进

1. **CDN 集成**：考虑使用 Cloudinary、imgix 等 CDN 服务
2. **图片压缩**：在上传时自动压缩和优化图片
3. **多尺寸生成**：为不同显示场景生成多个尺寸的缩略图
4. **懒加载**：为图片添加懒加载支持

## 相关文件

- `src/lib/upload.ts` - 上传配置和工具函数
- `src/middleware.ts` - 认证中间件配置
- `next.config.ts` - Next.js 配置
- `.gitignore` - Git 忽略规则
- 所有使用图片的组件文件

## 更新日期

2025-10-18
