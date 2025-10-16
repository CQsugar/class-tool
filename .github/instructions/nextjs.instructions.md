---
applyTo: 'src/app/**/*.tsx,src/app/**/*.ts,src/components/**/*.tsx,src/components/**/*.ts'
description: 'Next.js App Router开发最佳实践'
---

# Next.js App Router 开发指令

## 项目结构

- 使用App Router (`src/app/`)目录结构
- 使用路由分组组织页面：`(auth)`、`(dashboard)`等 (括号内名称不影响URL路径，仅用于组织代码和共享布局)
- 组件放在`src/components/`，按功能模块分类
- 工具函数放在`src/lib/`目录
- API路由使用`route.ts`文件

## 代码规范

- 所有组件使用TypeScript
- 使用函数式组件和React Hooks
- 服务端组件优先，仅在需要时使用`'use client'`
- 异步组件使用`async/await`语法
- 组件名使用PascalCase，文件名使用kebab-case

## 性能优化

- 使用动态导入分割代码
- 图片使用`next/image`组件
- 字体使用`next/font`优化
- 适当使用`loading.tsx`和`error.tsx`
- 避免不必要的客户端渲染

## 数据获取

- 服务端组件中直接获取数据
- 使用Prisma进行数据库操作
- API路由处理复杂业务逻辑
- 客户端使用SWR或React Query缓存数据

## 示例代码结构：

```typescript
// app/layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}

// app/(dashboard)/page.tsx
export default async function DashboardPage() {
  const data = await getData()
  return <div>{/* 页面内容 */}</div>
}

// app/api/students/route.ts
export async function GET() {
  const students = await prisma.student.findMany()
  return Response.json(students)
}
```
