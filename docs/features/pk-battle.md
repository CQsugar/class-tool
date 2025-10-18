# PK对战系统 - 功能说明

## 功能概述

PK对战系统是课堂工具的核心功能之一,支持个人PK、分组PK和随机PK三种模式,帮助教师组织课堂竞赛活动,激发学生学习积极性。

## 主要特性

### 1. 三种对战模式

#### 随机PK (RANDOM)

- **自动匹配**: 系统随机选择2名学生进行对战
- **公平性保证**: Fisher-Yates 洗牌算法确保真随机
- **最少人数**: 至少需要2名学生
- **使用场景**: 快速组织即兴对战,课堂互动

#### 个人PK (INDIVIDUAL)

- **手动选择**: 教师手动选择2名学生对战
- **定向对战**: 可指定特定学生参与
- **使用场景**: 针对性训练,特定学生挑战

#### 分组PK (GROUP)

- **团队对战**: 选择2个学生分组进行对战
- **集体荣誉**: 胜利分组所有成员获得奖励
- **成员显示**: 展示每个分组的成员列表(最多显示5个)
- **使用场景**: 团队协作,小组竞赛

### 2. 奖励积分系统

- **可配置奖励**: 0/5/10/15/20/30/50 积分可选
- **自动发放**: 设置胜者后自动发放积分
- **记录保存**: 完整的积分变动记录
- **分组奖励**: 分组胜利时所有成员平均获得奖励

### 3. 对战展示

- **实时状态**: 显示对战进行中/已完成/已取消状态
- **参与者信息**:
  - 个人: 头像、姓名、学号、当前积分
  - 分组: 分组名称、颜色、成员数量、成员列表
- **VS 标志**: 醒目的对战标识
- **胜者标识**: 金色奖杯图标和高亮效果

### 4. 流畅动画

- **匹配动画**: 旋转加载效果
- **入场动画**: 参与者卡片左右滑入
- **VS 动画**: 旋转缩放弹出
- **胜者动画**: 奖杯弹出和环形高亮
- **平滑过渡**: 所有状态变化都有动画

## 使用流程

### 创建 PK 对战

1. **选择模式**
   - 随机PK: 无需额外选择
   - 个人PK: 选择2名学生
   - 分组PK: 选择2个分组

2. **设置奖励**
   - 选择奖励积分(0-50)
   - 0 表示无奖励,纯荣誉对战

3. **开始对战**
   - 点击"开始PK"按钮
   - 系统自动匹配/验证参与者
   - 显示对战界面

### 决定胜负

1. **进行对战**
   - 教师组织学生完成对战任务
   - 可以是答题、演讲、表演等

2. **设置胜者**
   - 点击胜利方的"设为胜者"按钮
   - 系统自动:
     - 标记胜者
     - 发放奖励积分
     - 记录积分历史
     - 完成对战

3. **查看结果**
   - 胜者卡片显示金色奖杯
   - 胜者环形高亮
   - 显示"胜者"徽章

## 技术实现

### 后端 API

#### POST /api/pk/sessions

创建 PK 会话

**请求参数:**

```typescript
{
  mode: 'INDIVIDUAL' | 'GROUP' | 'RANDOM'
  rewardPoints?: number  // 0-1000, 默认0
  duration?: number      // 1-3600秒, 可选
  studentIds?: string[]  // INDIVIDUAL 模式必需, 2个学生ID
  groupIds?: string[]    // GROUP 模式必需, 2个分组ID
}
```

**响应数据:**

```typescript
{
  session: {
    id: string
    mode: PKMode
    status: PKStatus
    rewardPoints: number
    startedAt: string
    participants: Array<{
      id: string
      type: 'STUDENT' | 'GROUP'
      isWinner: boolean
      student?: Student
      group?: Group
    }>
  }
  message: string
}
```

#### GET /api/pk/sessions

查询 PK 会话列表

**查询参数:**

```typescript
{
  mode?: 'INDIVIDUAL' | 'GROUP' | 'RANDOM'
  status?: 'ONGOING' | 'FINISHED' | 'CANCELLED'
  page?: number    // 默认1
  limit?: number   // 默认20
}
```

#### PATCH /api/pk/sessions/[id]

设置胜者/更新会话

**请求参数:**

```typescript
{
  winnerId?: string            // 胜者ID(学生ID或分组ID)
  winnerType?: 'STUDENT' | 'GROUP'
  status?: 'ONGOING' | 'FINISHED' | 'CANCELLED'
}
```

**业务逻辑:**

1. 验证胜者是否在参与者中
2. 更新参与者 isWinner 状态
3. 发放奖励积分
4. 记录积分变动
5. 标记会话为已完成

#### DELETE /api/pk/sessions/[id]

删除 PK 会话

### 前端组件

#### PKPage 组件

路径: `src/app/(dashboard)/pk/page.tsx`

**主要状态:**

- `mode`: 当前选择的PK模式
- `rewardPoints`: 奖励积分设置
- `pkSession`: 当前PK会话信息
- `isStarting`: 是否正在开始对战

**核心方法:**

- `handleStartPK()`: 创建并开始PK对战
- `handleSetWinner()`: 设置胜者并发放奖励
- `renderParticipantCard()`: 渲染参与者卡片

### 数据库模型

#### PKSession 模型

```prisma
model PKSession {
  id           String          @id @default(cuid())
  userId       String
  mode         PKMode          // INDIVIDUAL, GROUP, RANDOM
  topic        String?
  rewardPoints Int             @default(0)
  winnerId     String?
  winnerType   PKWinnerType?   // STUDENT, GROUP
  status       PKStatus        @default(ONGOING)
  duration     Int?
  startedAt    DateTime        @default(now())
  finishedAt   DateTime?
  participants PKParticipant[]
}
```

#### PKParticipant 模型

```prisma
model PKParticipant {
  id        String       @id @default(cuid())
  sessionId String
  type      PKEntityType  // STUDENT, GROUP
  studentId String?
  groupId   String?
  isWinner  Boolean      @default(false)
  session   PKSession
  student   Student?
  group     StudentGroup?
}
```

## 积分奖励逻辑

### 个人PK奖励

```typescript
// 给胜利学生加分
await prisma.student.update({
  where: { id: winnerId },
  data: { points: { increment: rewardPoints } },
})

// 记录积分变动
await prisma.pointRecord.create({
  data: {
    studentId: winnerId,
    points: rewardPoints,
    type: 'ADD',
    reason: `PK胜利奖励: ${topic}`,
  },
})
```

### 分组PK奖励

```typescript
// 获取分组所有成员
const members = await prisma.studentGroupMember.findMany({
  where: { groupId: winnerId },
})

// 给每个成员加分
for (const member of members) {
  await prisma.student.update({
    where: { id: member.studentId },
    data: { points: { increment: rewardPoints } },
  })

  await prisma.pointRecord.create({
    data: {
      studentId: member.studentId,
      points: rewardPoints,
      type: 'ADD',
      reason: `PK胜利奖励(分组): ${topic}`,
    },
  })
}
```

## 扩展性设计

### 支持未来功能

- **主题设置**: topic 字段记录对战主题
- **时长限制**: duration 字段支持计时功能
- **多人对战**: 可扩展支持3人以上对战
- **评分系统**: 可添加分数字段记录对战得分

### 性能优化

- **索引优化**: userId + startedAt 复合索引
- **分页查询**: 支持大量历史记录查询
- **批量操作**: 分组奖励使用事务保证一致性

## 使用场景

### 课堂应用

1. **知识竞赛**: 随机选择学生进行知识问答PK
2. **演讲比赛**: 个人PK模式进行演讲对战
3. **小组辩论**: 分组PK模式进行团队辩论
4. **快速抢答**: 随机PK测试学生反应速度
5. **阶段测试**: 个人PK模式进行单元测试对抗

### 教学策略

- **激发兴趣**: 竞争机制提高参与度
- **及时反馈**: 即时奖励强化学习效果
- **公平竞争**: 随机模式确保公平性
- **团队协作**: 分组模式培养合作精神

## 待实现功能

### 个人/分组选择器

- [ ] 学生搜索和筛选
- [ ] 批量选择界面
- [ ] 实时积分显示
- [ ] 历史对战记录

### PK 历史

- [ ] 历史记录列表页面
- [ ] 筛选和搜索功能
- [ ] 数据统计和分析
- [ ] 导出功能

### 增强功能

- [ ] 计时器集成(Task 6.6)
- [ ] 声音效果
- [ ] 全屏模式(Task 6.8)
- [ ] 多人对战模式

## 测试建议

### 功能测试

- [ ] 随机模式: 0/1/2/多个学生场景
- [ ] 个人模式: 学生选择和验证
- [ ] 分组模式: 分组成员显示和奖励
- [ ] 奖励发放: 积分正确增加
- [ ] 记录创建: 积分历史正确记录

### 边界测试

- [ ] 并发创建: 同时创建多个PK会话
- [ ] 无效胜者: 非参与者设为胜者
- [ ] 重复设置: 多次设置胜者
- [ ] 权限检查: 跨用户访问

### UI/UX 测试

- [ ] 动画流畅度
- [ ] 响应式布局
- [ ] 加载状态
- [ ] 错误提示

## 相关任务

- Task 6.5: PK功能(个人/分组/随机模式) ✅
- Task 6.6: 课堂计时器(可集成到PK)
- Task 6.8: 工具最大化显示
- Task 4.0: 积分系统(依赖)

## 更新历史

- 2024-10-18: 初始实现,支持三种PK模式和奖励系统
