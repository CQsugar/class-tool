# 班主任班级管理平台 🎓

这是一个专为初中班主任设计的现代化数字班级管理平台，帮助班主任高效管理学生信息、建立科学的积分激励体系，并提供丰富的课堂管理工具。

## ✨ 核心功能

### 🏫 学生管理

- **学生信息管理**：完整的学生档案系统，支持批量导入导出
- **分组标签**：灵活的学生分组和标签管理系统
- **数据归档**：完整的历史数据归档和恢复功能

### 🏆 积分系统

- **积分规则**：自定义积分加减分规则，内置常用模板
- **快速操作**：单个或批量学生积分调整
- **完整记录**：详细的积分变动历史追踪

### 🛒 积分商城

- **多样奖励**：虚拟特权、实物奖品、班级权限等
- **库存管理**：自动库存扣减和补充提醒
- **兑换记录**：完整的兑换历史和统计分析

### 🎯 课堂工具

- **随机点名**：智能避重算法，24小时内不重复
- **PK对战**：个人PK、分组PK、随机PK三种模式
- **课堂计时器**：多功能计时工具
- **实时排行榜**：积分排名实时更新

## 🛠️ 技术栈

- **前端框架**：Next.js 15 + App Router
- **UI组件**：shadcn/ui + Tailwind CSS
- **认证系统**：Better Auth
- **数据库**：PostgreSQL + Prisma ORM
- **开发语言**：TypeScript
- **状态管理**：SWR
- **动画效果**：Framer Motion
- **图标库**：Lucide React

## 📁 项目结构

```
class-tool/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # 认证相关页面
│   │   ├── (dashboard)/       # 主要功能页面
│   │   │   ├── dashboard/     # 控制台首页
│   │   │   ├── students/      # 学生管理
│   │   │   ├── points/        # 积分系统
│   │   │   ├── store/         # 积分商城
│   │   │   ├── call/          # 随机点名
│   │   │   ├── pk/            # PK对战
│   │   │   ├── timer/         # 课堂计时器
│   │   │   └── admin/         # 系统管理
│   │   └── api/               # API路由
│   ├── components/            # React组件
│   │   ├── ui/               # shadcn/ui组件
│   │   ├── auth/             # 认证组件
│   │   ├── dashboard/        # 控制台组件
│   │   ├── students/         # 学生管理组件
│   │   └── ...               # 其他功能模块组件
│   ├── lib/                  # 工具函数和配置
│   └── hooks/                # 自定义React Hooks
├── prisma/                   # 数据库schema和迁移
├── docs/                     # 项目文档
├── scripts/                  # 部署和维护脚本
└── uploads/                  # 文件上传目录
```

## 🚀 快速开始

### 环境要求

- Node.js 18+
- PostgreSQL 12+
- pnpm

### 安装依赖

```bash
pnpm install
```

### 环境配置

1. 复制环境变量文件：

```bash
cp .env.example .env.local
```

2. 配置环境变量：

```bash
# 数据库连接
DATABASE_URL="postgresql://username:password@localhost:5432/class_tool"

# 认证密钥
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:3000"
```

### 数据库设置

```bash
# 推送数据库schema
pnpm db:push

# 初始化数据
pnpm db:seed
```

### 启动开发服务器

```bash
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 📋 可用脚本

```bash
# 开发
pnpm dev              # 启动开发服务器 (使用 Turbopack)
pnpm build            # 构建生产版本
pnpm start            # 启动生产服务器

# 代码质量
pnpm lint             # 运行ESLint检查
pnpm lint:fix         # 自动修复ESLint问题
pnpm format           # 格式化代码
pnpm format:check     # 检查代码格式
pnpm check:types      # TypeScript类型检查
pnpm check:all        # 运行所有检查

# 数据库
pnpm db:reset         # 重置数据库
pnpm db:generate      # 生成Prisma客户端
pnpm db:push          # 推送schema到数据库
pnpm db:seed          # 执行数据种子
pnpm db:setup         # 完整数据库设置

# 测试
pnpm test             # 运行测试
```

## 🏗️ 部署

### Docker部署

```bash
# 生产环境部署
docker-compose -f docker-compose.prod.yml up -d

# 开发环境部署
docker-compose up -d
```

### 传统部署

```bash
# 构建应用
pnpm build

# 启动应用
pnpm start
```

## 📖 文档

- [开发环境设置](./docs/development-setup.md)
- [部署指南](./docs/deployment-guide.md)
- [功能特性](./docs/features/)
- [故障排除](./docs/troubleshooting.md)
- [产品需求文档](./docs/tasks/prd-class-management-platform.md)

## 🤝 开发规范

### 代码标准

- 使用TypeScript进行严格类型检查
- 遵循ESLint和Prettier配置
- 使用函数式组件和React Hooks
- 服务端组件优先，必要时使用客户端组件

### 提交规范

- 使用Conventional Commits格式
- 通过husky和lint-staged进行代码质量检查
- 所有提交必须通过类型检查和格式化检查

### 架构原则

- 使用App Router进行路由管理
- 组件按功能模块组织
- 数据库操作通过Prisma进行
- 认证使用Better Auth统一管理

## 📄 许可证

此项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🆘 支持

如果你遇到问题或有功能建议，请：

1. 查看[故障排除文档](./docs/troubleshooting.md)
2. 搜索已有的issue
3. 创建新的issue并提供详细信息

---

**注意**：这是一个专业的班级管理工具，设计时充分考虑了教育场景的实际需求。建议在正式使用前先进行充分的测试和培训。
