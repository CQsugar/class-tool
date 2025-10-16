---
applyTo: "src/**/*.ts,src/**/*.tsx"
description: "班主任班级管理平台业务逻辑开发指令"
---

# 班主任班级管理平台 - 业务逻辑开发指令

## 业务逻辑要求
- 支持50+学生的班级管理
- 积分系统不设上下限，支持负数
- 随机点名支持24小时避重
- PK功能支持个人/分组/随机三种模式
- 数据归档仅包含学生信息，不包含规则和商品

## 用户体验
- 界面简洁直观，适合非技术背景用户
- 重要操作提供二次确认
- 支持快捷键操作
- 控制台支持最大化显示
- 提供友好的错误提示

## 性能要求
- 支持50+学生数据快速加载
- 积分记录查询支持分页
- 批量操作显示进度
- 优化数据库查询性能

## 数据安全
- 学生信息加密存储
- 完整的操作日志记录
- 定期数据备份
- 实现权限控制

## 功能优先级
1. 快速积分加减操作面板
2. 随机点名工具
3. 学生个人积分排行榜
4. 学生PK功能
5. 课堂计时器工具
6. 班级整体数据概览面板

## 示例业务逻辑：

```typescript
// 积分加减操作
export async function updateStudentPoints(data: {
  studentId: string
  points: number
  reason: string
  ruleId?: string
  userId: string
}) {
  // 验证学生存在
  const student = await prisma.student.findUnique({
    where: { id: data.studentId }
  })
  
  if (!student) {
    throw new Error('学生不存在')
  }

  // 使用事务确保数据一致性
  return await prisma.$transaction(async (tx) => {
    await tx.student.update({
      where: { id: data.studentId },
      data: { points: { increment: data.points } }
    })

    await tx.pointRecord.create({
      data: {
        studentId: data.studentId,
        points: data.points,
        reason: data.reason,
        type: data.points > 0 ? 'ADD' : 'SUBTRACT',
        userId: data.userId,
        ruleId: data.ruleId,
      }
    })
  })
}

// 随机点名(避重)
export async function getRandomStudent(
  userId: string,
  excludeRecent: boolean = true
) {
  const students = await prisma.student.findMany({
    where: {
      userId,
      isArchived: false,
    }
  })

  if (excludeRecent) {
    // 排除24小时内被点名的学生
    const recentCalls = await prisma.randomCall.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    })
    
    const excludeIds = recentCalls.map(call => call.studentId)
    const availableStudents = students.filter(
      student => !excludeIds.includes(student.id)
    )
    
    if (availableStudents.length === 0) {
      // 如果所有学生都被点过，重置记录
      await prisma.randomCall.deleteMany({
        where: { userId }
      })
      return students[Math.floor(Math.random() * students.length)]
    }
    
    return availableStudents[Math.floor(Math.random() * availableStudents.length)]
  }

  return students[Math.floor(Math.random() * students.length)]
}

// PK功能实现
export async function createPKBattle(data: {
  type: 'INDIVIDUAL' | 'GROUP' | 'RANDOM'
  participants: string[]
  topic: string
  reward: number
  userId: string
}) {
  return await prisma.pKBattle.create({
    data: {
      type: data.type,
      topic: data.topic,
      reward: data.reward,
      status: 'ONGOING',
      userId: data.userId,
      participants: {
        create: data.participants.map(id => ({
          studentId: id,
        }))
      }
    },
    include: {
      participants: {
        include: { student: true }
      }
    }
  })
}

// Better Auth会话验证示例
export async function validateSession(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers
  })
  
  if (!session) {
    throw new Error('未授权访问')
  }
  
  return session.user
}
```

## 错误处理模式
- 使用try-catch包装异步操作
- 提供用户友好的错误信息
- 记录详细的错误日志
- 实现错误边界组件

## 代码质量要求
- 函数和变量命名清晰明确
- 添加必要的代码注释
- 保持代码的可读性和可维护性
- 遵循一致的代码风格规范