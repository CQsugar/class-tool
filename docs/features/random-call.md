# 随机点名工具 - 功能说明

## 功能概述

随机点名工具是课堂工具模块的核心功能之一,支持从班级学生中随机选择一名学生,并提供24小时避重机制,确保公平性。

## 主要特性

### 1. 智能避重机制

- **可配置避重时间**: 支持 0/1/6/12/24/48/72 小时可选
- **自动避重**: 在设定时间内已被点过名的学生不会被重复选中
- **智能重置**: 当所有学生都在避重期内时,自动重置避重机制并提示用户
- **避重统计**: 实时显示可选学生数和已排除学生数

### 2. 流畅的交互体验

- **动画效果**:
  - 点名过程旋转加载动画
  - 结果展示缩放弹出效果
  - 信息渐进式显示(头像→姓名→详情)
- **即时反馈**: Toast 提示点名结果
- **一键重新点名**: 点名后可快速重新随机选择

### 3. 学生信息展示

- **头像显示**: 支持自定义头像或姓名首字母
- **基本信息**: 姓名、学号、当前积分
- **视觉设计**: 圆形头像 + 环形装饰 + 角标图标

### 4. 历史记录

- **实时更新**: 点名后自动刷新历史记录
- **最近10条**: 展示最近10次点名记录
- **详细信息**: 包含学生姓名、头像、点名时间
- **时间格式化**: 显示月日时分(中文格式)

## 使用场景

1. **课堂提问**: 随机选择学生回答问题
2. **作业检查**: 随机抽查学生作业完成情况
3. **课堂展示**: 随机选择学生进行演讲或展示
4. **公平选择**: 确保每个学生有相同机会参与课堂活动

## 技术实现

### 后端 API

#### POST /api/call/random

随机选择一名学生

**请求参数:**

```typescript
{
  avoidHours: number  // 避重时间(小时), 默认24
  excludeIds?: string[]  // 手动排除的学生ID列表
}
```

**响应数据:**

```typescript
{
  student: {
    id: string
    name: string
    studentNo: string
    avatar: string | null
    points: number
  }
  totalAvailable: number // 可选学生总数
  totalExcluded: number // 已排除学生数
  avoidResetUsed: boolean // 是否使用了避重重置
  message: string // 提示信息
}
```

**错误响应:**

- `401`: 未登录
- `404`: 没有可用学生
- `500`: 服务器错误

#### GET /api/call/history

查询点名历史

**查询参数:**

```typescript
{
  limit?: number  // 每页数量, 默认10
  page?: number   // 页码, 默认1
}
```

**响应数据:**

```typescript
{
  histories: Array<{
    id: string
    mode: string
    calledAt: string
    student: {
      id: string
      name: string
      studentNo: string
      avatar: string | null
    } | null
  }>
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
```

### 前端组件

#### CallPage 组件

路径: `src/app/(dashboard)/call/page.tsx`

**主要状态:**

- `selectedStudent`: 当前选中的学生
- `isRolling`: 是否正在点名中
- `avoidHours`: 避重时间设置
- `history`: 点名历史记录
- `stats`: 统计信息

**核心方法:**

- `handleRandomCall()`: 执行随机点名
- `handleReroll()`: 重新点名
- `loadHistory()`: 加载历史记录

### 数据库模型

使用 `CallHistory` 模型记录点名历史:

```prisma
model CallHistory {
  id        String   @id @default(cuid())
  userId    String
  studentId String?
  mode      String
  groupId   String?
  calledAt  DateTime @default(now())

  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  student  Student?  @relation(fields: [studentId], references: [id], onDelete: SetNull)
  group    StudentGroup? @relation(fields: [groupId], references: [id], onDelete: SetNull)
}
```

## 避重算法

1. **查询避重窗口内的点名记录**

   ```typescript
   const avoidTime = new Date()
   avoidTime.setHours(avoidTime.getHours() - avoidHours)

   const recentCalledIds = await prisma.callHistory.findMany({
     where: { userId: user.id, calledAt: { gte: avoidTime } },
   })
   ```

2. **排除已点名学生**

   ```typescript
   const excludeIds = [...manualExcludeIds, ...recentCalledIds]

   const availableStudents = await prisma.student.findMany({
     where: {
       userId: user.id,
       isArchived: false,
       id: { notIn: excludeIds },
     },
   })
   ```

3. **自动重置机制**

   ```typescript
   if (availableStudents.length === 0 && avoidHours > 0) {
     // 重置避重,从所有学生中选择
     availableStudents = await prisma.student.findMany({
       where: { userId: user.id, isArchived: false },
     })
     avoidResetUsed = true
   }
   ```

4. **随机选择**
   ```typescript
   const randomIndex = Math.floor(Math.random() * availableStudents.length)
   const selectedStudent = availableStudents[randomIndex]
   ```

## 扩展性设计

### 支持未来功能

- **手动排除**: 预留 `excludeIds` 参数,可用于分组PK等场景
- **模式扩展**: CallHistory 包含 `mode` 字段,支持记录不同点名模式
- **分组支持**: CallHistory 包含 `groupId` 字段,为分组点名预留

### 性能优化

- **索引优化**: userId + calledAt 复合索引加速查询
- **分页查询**: 历史记录支持分页,避免一次加载过多数据
- **客户端缓存**: 使用 React 状态管理减少 API 调用

## 测试建议

### 功能测试

- [ ] 0个学生场景: 应返回404错误
- [ ] 1个学生场景: 应能正常点名
- [ ] 多个学生场景: 验证随机性
- [ ] 避重机制: 24小时内不重复
- [ ] 避重重置: 所有学生都在避重期时自动重置
- [ ] 历史记录: 点名后自动刷新

### 边界测试

- [ ] 未登录访问: 返回401
- [ ] 并发点名: 同一用户快速多次点名
- [ ] 大量历史记录: 测试分页性能
- [ ] 网络异常: 测试错误处理和提示

### UI/UX 测试

- [ ] 动画流畅度: 各种设备和浏览器
- [ ] 响应式布局: 移动端和桌面端显示
- [ ] 加载状态: 按钮禁用和加载提示
- [ ] Toast 提示: 成功/警告/错误信息

## 相关任务

- Task 6.3: 随机点名工具 ✅
- Task 6.5: PK功能(可复用避重机制)
- Task 8.1: 端到端功能验证

## 更新历史

- 2024-XX-XX: 初始实现,支持基础随机点名和避重机制
