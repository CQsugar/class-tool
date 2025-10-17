# 班主任班级管理平台 - 任务列表

基于PRD文档生成的开发任务拆分，采用Next.js + shadcn/ui + Auth.js + Prisma + PostgreSQL技术栈。

## 相关文件

- `src/app/layout.tsx` - Next.js App Router根布局文件，包含全局样式和认证配置
- `src/app/page.tsx` - 首页/控制台仪表板页面
- `src/app/providers.tsx` - AuthUIProvider配置文件，包含中文本地化
- `src/app/api/auth/[...all]/route.ts` - Better Auth API路由处理器
- `src/app/(auth)/auth/[path]/page.tsx` - auth页面聚合
- `src/app/(dashboard)/settings/page.tsx` - 用户设置页面
- `src/app/(dashboard)/students/page.tsx` - 学生信息管理页面
- `src/app/(dashboard)/points/page.tsx` - 积分系统管理页面
- `src/app/(dashboard)/store/page.tsx` - 积分商城页面
- `src/app/(dashboard)/archive/page.tsx` - 数据归档页面
- `src/app/api/students/route.ts` - 学生列表和创建API (GET支持分页、搜索、筛选)
- `src/app/api/students/[id]/route.ts` - 单个学生CRUD API (GET/PATCH/DELETE)
- `src/app/api/students/batch/archive/route.ts` - 批量归档/恢复学生API
- `src/app/api/students/batch/delete/route.ts` - 批量永久删除学生API
- `src/app/api/students/batch/import/route.ts` - 批量导入学生API（Excel）
- `src/app/(dashboard)/students/page.tsx` - 学生列表页面（带数据表格和分页）
- `src/components/students/data-table.tsx` - 可复用的数据表格组件（使用TanStack Table）
- `src/components/students/columns.tsx` - 学生表格列定义（支持排序、筛选、操作）
- `src/components/students/student-form-dialog.tsx` - 学生信息表单对话框（新增/编辑）
- `src/components/students/import-student-dialog.tsx` - Excel批量导入对话框（带模板下载和数据验证）
- `src/components/students/export-student-dialog.tsx` - Excel导出对话框（支持全部/选中/筛选导出）
- `src/components/ui/` - shadcn/ui组件目录
- `src/components/ui/sonner.tsx` - Sonner toast通知组件
- `src/components/ui/pagination.tsx` - 分页组件
- `src/components/ui/checkbox.tsx` - 复选框组件
- `src/components/ui/select.tsx` - 下拉选择组件
- `src/components/ui/textarea.tsx` - 多行文本输入组件
- `src/components/ui/alert.tsx` - 警告提示组件
- `src/components/ui/radio-group.tsx` - 单选按钮组组件
- `src/components/dashboard/` - 自定义仪表板组件
- `src/components/forms/` - 表单组件
- `src/components/auth/profile-form.tsx` - 用户设置表单组件，使用better-auth-ui
- `src/components/auth/dashboard-user-button.tsx` - Dashboard用户按钮组件
- `src/components/auth/session-management.tsx` - 会话管理组件，使用SessionsCard
- `src/components/auth/security-overview.tsx` - 安全概览组件
- `src/components/layout/dashboard-header.tsx` - 更新后的Dashboard头部组件，集成用户认证
- `src/lib/auth.ts` - Better Auth配置文件，包含multi-session和安全配置
- `src/lib/auth-client.ts` - Better Auth客户端配置，包含multi-session支持
- `src/lib/auth-utils.ts` - 认证工具函数 (getSession, requireAuth, isAuthenticated)
- `src/lib/prisma.ts` - Prisma客户端配置
- `src/lib/utils.ts` - 工具函数
- `src/lib/excel-export.ts` - Excel导出工具函数 (支持导出全部/选中学生)
- `src/lib/validations/` - 数据验证schema
- `src/lib/validations/student.ts` - 学生信息验证Schema (包含创建、更新、查询、批量操作等)
- `prisma/schema.prisma` - 数据库模型定义
- `prisma/seed.ts` - 数据库种子文件
- `middleware.ts` - Next.js中间件，包含安全头设置和安全监控
- `.env.example` - 环境变量示例文件
- `components.json` - shadcn/ui配置文件

### 注意事项

- 组件按功能模块组织，便于维护和扩展
- API路由使用RESTful设计原则
- 数据库操作优先考虑性能和数据一致性
- 用户界面注重响应式设计和用户体验

## 任务

- [x] 1.0 项目初始化和基础架构搭建
  - [x] 1.1 初始化Next.js项目并配置TypeScript和Tailwind CSS ✅
  - [x] 1.2 安装和配置shadcn/ui组件库 ✅
  - [x] 1.3 配置Prisma和PostgreSQL数据库连接 ✅
  - [x] 1.4 设置项目目录结构和路由分组 ✅
  - [x] 1.5 配置ESLint、Prettier和Git钩子 ✅
  - [x] 1.6 创建环境变量配置文件

- [x] 2.0 用户认证系统开发
  - [x] 2.1 配置Better Auth和Prisma适配器
  - [x] 2.2 创建用户数据模型和数据库表
  - [x] 2.3 实现登录页面UI组件(使用Better Auth UI)
  - [x] 2.4 配置认证中间件和路由保护
  - [x] 2.5 实现注册功能和用户信息管理
  - [x] 2.6 添加会话管理和安全配置

- [ ] 3.0 学生信息管理模块开发
  - [x] 3.1 设计学生信息数据模型和关系
  - [x] 3.2 创建学生CRUD API路由
  - [x] 3.3 实现学生列表页面和分页功能
  - [x] 3.4 开发学生信息表单(新增/编辑)
  - [x] 3.5 实现批量Excel导入功能
  - [x] 3.6 开发Excel导出功能
  - [x] 3.7 添加数据验证和错误处理
  - [x] 3.8 实现搜索和筛选功能

- [ ] 4.0 积分系统核心功能开发
  - [ ] 4.1 设计积分规则和记录数据模型
  - [ ] 4.2 创建积分规则管理API和UI
  - [ ] 4.3 实现快速加减分功能和界面
  - [ ] 4.4 开发积分记录查询和展示
  - [ ] 4.5 实现学生分组管理功能
  - [ ] 4.6 开发标签系统和批量操作
  - [ ] 4.7 实现积分重置功能(含多重确认)
  - [ ] 4.8 创建积分规则模板系统

- [ ] 5.0 积分商城功能开发
  - [ ] 5.1 设计商品和兑换记录数据模型
  - [ ] 5.2 创建商品管理API和CRUD功能
  - [ ] 5.3 实现商城展示页面和商品列表
  - [ ] 5.4 开发商品分类管理(虚拟/实物/特权)
  - [ ] 5.5 实现库存管理和自动扣减
  - [ ] 5.6 开发积分兑换流程和确认机制
  - [ ] 5.7 创建兑换记录查询和管理
  - [ ] 5.8 实现商城统计和报表功能

- [ ] 6.0 控制台首页和快捷工具开发
  - [ ] 6.1 设计响应式仪表板布局
  - [ ] 6.2 实现快速积分加减操作面板
  - [ ] 6.3 开发随机点名工具(含避重机制)
  - [ ] 6.4 创建学生积分排行榜组件
  - [ ] 6.5 实现PK功能(个人/分组/随机模式)
  - [ ] 6.6 开发课堂计时器工具
  - [ ] 6.7 创建班级数据概览面板
  - [ ] 6.8 实现工具最大化显示和快速切换
  - [ ] 6.9 优化控制台性能和用户体验

- [ ] 7.0 数据归档功能开发
  - [ ] 7.1 设计归档数据模型和存储结构
  - [ ] 7.2 实现学生信息批量归档API
  - [ ] 7.3 创建归档操作UI和确认流程
  - [ ] 7.4 开发归档数据查询和展示
  - [ ] 7.5 实现归档数据恢复功能
  - [ ] 7.6 添加归档前数据备份机制
  - [ ] 7.7 创建归档日志和审计功能

- [ ] 8.0 系统集成和部署优化
  - [ ] 8.1 执行端到端功能验证和用户流程测试
  - [ ] 8.2 进行性能测试和优化(支持50+学生)
  - [ ] 8.3 实现数据库迁移和种子数据
  - [ ] 8.4 配置生产环境部署流程
  - [ ] 8.5 设置监控和错误日志记录
  - [ ] 8.6 创建用户文档和部署指南
  - [ ] 8.7 进行安全审计和漏洞扫描
  - [ ] 8.8 优化构建流程和SEO配置
