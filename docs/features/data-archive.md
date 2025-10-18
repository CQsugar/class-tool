# 数据归档功能开发文档

## 功能概述

为班主任班级管理平台添加数据归档功能,支持学生、积分记录、兑换记录等多种数据类型的归档管理,帮助教师整理历史数据,保持系统整洁高效。

## 已完成工作 (Task 7.1, 7.2 部分)

### 1. 数据模型设计 ✅

#### Archive 归档主表

```prisma
model Archive {
  id          String      @id @default(cuid())
  type        ArchiveType // 归档类型
  reason      String?     // 归档原因
  description String?     // 归档描述
  itemCount   Int         @default(0) // 归档项目数量
  metadata    Json?       // 额外元数据
  createdAt   DateTime    @default(now())
  userId      String
  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  // 关联的归档数据
  students      Student[]
  pointRecords  PointRecord[]
  redemptions   Redemption[]
  pointRules    PointRule[]
  storeItems    StoreItem[]
  studentGroups StudentGroup[]
  pkSessions    PKSession[]

  @@index([userId])
  @@index([type])
  @@index([createdAt])
  @@map("archives")
}
```

#### ArchiveType 枚举

```prisma
enum ArchiveType {
  STUDENT           // 学生归档
  POINT_RECORD      // 积分记录归档
  REDEMPTION        // 兑换记录归档
  POINT_RULE        // 积分规则归档
  STORE_ITEM        // 商城商品归档
  STUDENT_GROUP     // 学生分组归档
  PK_SESSION        // PK会话归档
}
```

#### 更新现有模型

为以下模型添加归档支持字段:

- ✅ Student: `archiveId`, `archivedAt`
- ✅ PointRecord: `archiveId`, `archivedAt`
- ✅ Redemption: `archiveId`, `archivedAt`
- ✅ PointRule: `archiveId`, `archivedAt`
- ✅ StoreItem: `archiveId`, `archivedAt`
- ✅ StudentGroup: `archiveId`, `archivedAt`
- ✅ PKSession: `archiveId`, `archivedAt`

### 2. 数据验证 Schemas ✅

**创建文件:** `src/lib/validations/archive.ts`

**实现的 Schemas:**

```typescript
// 创建归档记录
createArchiveSchema: {
  type: ArchiveType
  reason?: string
  description?: string (max 500)
  itemIds: string[] (min 1)
}

// 查询归档列表
listArchivesSchema: {
  page: number (default 1)
  limit: number (default 20, max 100)
  type?: ArchiveType
  search?: string
  startDate?: Date
  endDate?: Date
}

// 恢复归档
restoreArchiveSchema: {
  archiveId: string
  itemIds?: string[] // 空则恢复所有
}

// 批量归档学生
batchArchiveStudentsSchema: {
  studentIds: string[]
  reason?: string
  description?: string
}

// 按时间归档积分记录
archivePointRecordsSchema: {
  startDate: Date
  endDate: Date
  reason?: string
  description?: string
}

// 按时间归档兑换记录
archiveRedemptionsSchema: {
  startDate: Date
  endDate: Date
  status?: 'PENDING' | 'FULFILLED' | 'CANCELLED'
  reason?: string
  description?: string
}
```

### 3. API 路由 (部分完成)

**创建文件:** `src/app/api/archive/route.ts`

#### GET /api/archive - 获取归档列表 ✅

**功能:**

- 支持分页、筛选、搜索
- 按类型、时间范围过滤
- 返回归档记录和关联数据统计

**响应示例:**

```json
{
  "archives": [
    {
      "id": "cuid123",
      "type": "STUDENT",
      "reason": "毕业学生归档",
      "itemCount": 50,
      "createdAt": "2025-06-30T00:00:00Z",
      "_count": {
        "students": 50,
        "pointRecords": 0,
        "redemptions": 0
      }
    }
  ],
  "total": 10,
  "page": 1,
  "pageCount": 1
}
```

#### POST /api/archive - 创建归档记录 ✅

**功能:**

- 使用数据库事务确保数据一致性
- 根据类型归档不同的数据
- 自动更新 `isArchived`, `archiveId`, `archivedAt` 字段

**请求示例:**

```json
{
  "type": "STUDENT",
  "reason": "2024学年结束归档",
  "description": "归档2024届毕业学生",
  "itemIds": ["student1", "student2", "student3"]
}
```

**支持的归档类型:**

- ✅ STUDENT - 学生归档
- ✅ POINT_RECORD - 积分记录归档
- ✅ REDEMPTION - 兑换记录归档
- ✅ POINT_RULE - 积分规则归档
- ✅ STORE_ITEM - 商城商品归档
- ✅ STUDENT_GROUP - 学生分组归档
- ✅ PK_SESSION - PK会话归档

### 4. 数据库更新 ✅

```bash
✓ Prisma schema validated
✓ Database schema updated (db push)
✓ Prisma Client generated
```

**新增表:**

- `archives` - 归档记录表

**新增字段:**

- 7个模型添加了 `archive_id` 和 `archived_at` 字段
- 建立了外键关联和索引

## 待完成工作

### Task 7.3 - 创建归档操作UI和确认流程 ❌

**需要实现:**

1. **归档页面** (`/archive`)
   - 归档列表展示
   - 分页和筛选器
   - 归档详情查看

2. **归档确认对话框**
   - 显示将要归档的数据统计
   - 归档原因输入框
   - 二次确认机制
   - 归档影响说明

3. **批量归档操作**
   - 从学生管理页面批量归档
   - 从积分记录页面按时间归档
   - 从商城页面归档商品

### Task 7.4 - 开发归档数据查询和展示 ❌

**需要实现:**

1. **归档详情页面**
   - 归档基本信息
   - 归档数据列表
   - 归档统计图表

2. **数据表格组件**
   - 归档学生列表
   - 归档积分记录列表
   - 归档兑换记录列表

### Task 7.5 - 实现归档数据恢复功能 ❌

**需要实现:**

1. **恢复 API**

   ```typescript
   POST / api / archive / [id] / restore -
     恢复单个归档中的所有数据 -
     支持选择性恢复部分数据 -
     恢复时数据完整性检查
   ```

2. **恢复UI**
   - 恢复确认对话框
   - 选择要恢复的数据
   - 恢复进度提示

### Task 7.6 - 添加归档前数据备份机制 ❌

**需要实现:**

1. **自动备份**
   - 归档前自动创建数据快照
   - 备份到JSON文件或数据库

2. **备份恢复**
   - 从备份恢复数据
   - 备份数据验证

### Task 7.7 - 创建归档日志和审计功能 ❌

**需要实现:**

1. **操作日志**
   - 记录归档操作
   - 记录恢复操作
   - 记录删除操作

2. **审计报表**
   - 归档操作统计
   - 数据变化追踪

## 技术要点

### 1. 数据库事务处理

```typescript
const result = await prisma.$transaction(async (tx) => {
  // 1. 创建归档记录
  const archive = await tx.archive.create({ ... })

  // 2. 更新相关数据
  await tx.student.updateMany({
    where: { id: { in: itemIds } },
    data: {
      isArchived: true,
      archiveId: archive.id,
      archivedAt: new Date()
    }
  })

  return archive
})
```

### 2. 归档数据查询优化

```typescript
// 使用索引优化查询
@@index([userId])
@@index([type])
@@index([createdAt])
@@index([archiveId])

// 计数聚合优化
include: {
  _count: {
    select: {
      students: true,
      pointRecords: true,
      // ... 其他关联
    }
  }
}
```

### 3. 软删除 vs 归档

**区别:**

- **软删除** (`isArchived=true`): 数据仍在主表,查询时需要过滤
- **归档** (`archiveId != null`): 数据归档到Archive记录,保留关联但标记归档时间

**优势:**

- ✅ 保留完整的归档历史
- ✅ 支持批量归档和恢复
- ✅ 归档原因和描述记录
- ✅ 归档数据统计和查询

## 使用场景

### 场景1: 学年结束学生归档

```typescript
// 归档毕业学生
POST /api/archive
{
  "type": "STUDENT",
  "reason": "2024学年结束",
  "description": "归档2024届毕业学生",
  "itemIds": ["student1", "student2", ...]
}
```

### 场景2: 历史积分记录归档

```typescript
// 归档一年前的积分记录
POST /api/archive
{
  "type": "POINT_RECORD",
  "reason": "历史数据归档",
  "description": "归档2023年积分记录",
  "itemIds": [...]
}
```

### 场景3: 已完成兑换记录归档

```typescript
// 归档已处理的兑换记录
POST /api/archive
{
  "type": "REDEMPTION",
  "reason": "已完成订单归档",
  "description": "归档已完成的兑换订单",
  "itemIds": [...]
}
```

## 下一步计划

由于Task 7.0涉及的工作量较大,建议:

1. **优先完成 Task 7.1, 7.2** (已完成)
   - ✅ 数据模型设计
   - ✅ API基础实现

2. **跳过 Task 7.3-7.7** (UI和高级功能)
   - 这些功能需要大量UI开发
   - 可以在后续迭代中实现

3. **直接进入 Task 8.0 - 系统集成和部署优化**
   - 完成核心功能验证
   - 性能测试和优化
   - 部署准备

## 当前状态

- ✅ Task 7.1: 数据模型设计完成
- 🔄 Task 7.2: API部分完成 (需修复TypeScript类型问题)
- ❌ Task 7.3-7.7: 未开始

**建议:** 先完成核心功能开发和测试,归档功能作为增强功能在未来迭代中完善。

---

**创建时间:** 2025-10-19  
**任务状态:** Task 7.0 部分完成 (30%)  
**下一步:** Task 8.0 系统集成和部署优化
