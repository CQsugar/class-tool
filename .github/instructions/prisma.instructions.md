---
applyTo: "prisma/**/*.prisma,src/lib/prisma.ts,src/app/api/**/*.ts"
description: "Prisma数据库开发最佳实践"
---

# Prisma + PostgreSQL 开发指令

## 数据库设计
- 使用明确的表名和字段名
- 设置适当的索引提升查询性能
- 使用外键约束确保数据完整性
- 实现软删除而非硬删除

## Schema最佳实践
- 使用枚举类型约束数据
- 设置默认值和非空约束
- 使用@map重命名数据库字段
- 添加@@map自定义表名

## 查询优化
- 使用include/select优化关联查询
- 避免N+1查询问题
- 使用事务处理复杂操作
- 实现分页查询

## 类型安全
- 使用Prisma生成的类型
- 创建自定义类型和验证
- 使用Zod验证输入数据
- 实现类型安全的API

## 示例Schema：

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  // 关联关系
  students  Student[]
  pointRules PointRule[]
  pointRecords PointRecord[]
  
  @@map("users")
}

model Student {
  id          String   @id @default(cuid())
  name        String
  studentNo   String   @unique @map("student_no")
  gender      Gender
  phone       String?
  parentPhone String?  @map("parent_phone")
  points      Int      @default(0)
  isArchived  Boolean  @default(false) @map("is_archived")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  
  // 关联关系
  userId      String   @map("user_id")
  user        User     @relation(fields: [userId], references: [id])
  groups      StudentGroup[]
  tags        StudentTag[]
  pointRecords PointRecord[]
  redemptions  Redemption[]
  
  @@index([userId])
  @@index([studentNo])
  @@map("students")
}

enum Gender {
  MALE
  FEMALE
}

enum PointType {
  ADD
  SUBTRACT
  RESET
}
```

## 查询示例：

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// 查询示例
export async function getStudentsWithPoints(userId: string) {
  return await prisma.student.findMany({
    where: {
      userId,
      isArchived: false,
    },
    include: {
      pointRecords: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      groups: true,
      tags: true,
    },
    orderBy: { points: 'desc' },
  })
}

// 事务示例
export async function addPointsToStudent(
  studentId: string,
  points: number,
  reason: string,
  userId: string,
  ruleId?: string
) {
  return await prisma.$transaction(async (tx) => {
    // 更新学生积分
    await tx.student.update({
      where: { id: studentId },
      data: {
        points: { increment: points },
      },
    })

    // 记录积分变动
    await tx.pointRecord.create({
      data: {
        studentId,
        points,
        reason,
        type: points > 0 ? 'ADD' : 'SUBTRACT',
        userId,
        ruleId,
      },
    })
  })
}
```

## 数据验证
- 使用Zod创建输入验证schema
- 验证与Prisma类型保持一致
- 处理数据库约束错误
- 实现业务逻辑验证