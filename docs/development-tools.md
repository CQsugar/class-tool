# 开发工具配置说明

本项目已配置完整的代码质量保证工具链，包括ESLint、Prettier、Husky和Commitlint。

## 工具概览

### 1. ESLint - 代码检查

- **作用**：检查JavaScript/TypeScript代码质量和潜在问题
- **配置文件**：`eslint.config.mjs`
- **规则**：基于Next.js推荐配置 + 自定义规则

### 2. Prettier - 代码格式化

- **作用**：统一代码格式
- **配置文件**：`.prettierrc`
- **特性**：支持Tailwind CSS类名排序

### 3. Husky - Git钩子管理

- **作用**：在Git操作时自动执行检查
- **配置目录**：`.husky/`
- **钩子**：pre-commit, commit-msg

### 4. lint-staged - 暂存文件处理

- **作用**：只对Git暂存区文件运行检查
- **配置**：package.json中的`lint-staged`字段

### 5. commitlint - 提交信息规范

- **作用**：验证commit消息格式
- **配置文件**：`commitlint.config.js`
- **规范**：Conventional Commits

## 可用脚本

### 代码质量检查

```bash
# ESLint检查
pnpm run lint

# ESLint自动修复
pnpm run lint:fix

# Prettier格式检查
pnpm run format:check

# Prettier自动格式化
pnpm run format

# TypeScript类型检查
pnpm run check:types

# 全面质量检查
pnpm run check:all
```

### 数据库操作

```bash
# 生成Prisma客户端
pnpm run db:generate

# 数据库迁移
npx prisma migrate dev

# 重置数据库
pnpm run db:reset
```

## Git工作流

### 1. 提交前检查（pre-commit钩子）

当执行 `git commit` 时，会自动：

1. 运行 `lint-staged`
2. 对暂存文件执行ESLint修复
3. 对暂存文件执行Prettier格式化
4. 如果有错误，阻止提交

### 2. 提交消息检查（commit-msg钩子）

提交消息必须符合Conventional Commits格式：

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### 允许的type类型：

- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档变更
- `style`: 代码格式（不影响代码运行）
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 增加测试
- `chore`: 构建过程或辅助工具的变动
- `ci`: CI配置文件和脚本的变动
- `build`: 影响构建系统或外部依赖的变动
- `revert`: 回滚

#### 示例提交消息：

```bash
git commit -m "feat: 添加学生积分管理功能"
git commit -m "fix: 修复随机点名重复问题"
git commit -m "docs: 更新API文档"
```

## 开发建议

### 1. 代码编写

- 使用VS Code并安装推荐的扩展
- 保存时自动格式化（配置VS Code）
- 定期运行 `pnpm run check:all` 检查代码质量

### 2. 提交流程

```bash
# 1. 添加文件到暂存区
git add .

# 2. 提交（会自动运行pre-commit检查）
git commit -m "feat: 实现学生管理功能"

# 3. 推送
git push
```

### 3. 解决问题

如果提交被阻止：

1. 查看错误信息
2. 运行 `pnpm run lint:fix` 自动修复
3. 运行 `pnpm run format` 格式化代码
4. 重新提交

### 4. 跳过钩子（不推荐）

紧急情况下可以跳过钩子：

```bash
git commit --no-verify -m "emergency fix"
```

## 配置详情

### ESLint配置要点

- 继承Next.js官方配置
- 启用TypeScript支持
- 集成Prettier规则
- 自定义React和通用规则

### Prettier配置要点

- 单引号优先
- 不使用分号
- 80字符换行
- Tailwind CSS类名自动排序
- 支持多种文件类型

### lint-staged配置

```json
{
  "*.{js,jsx,ts,tsx}": ["next lint --fix --file", "prettier --write"],
  "*.{json,md,yml,yaml}": ["prettier --write"],
  "*.{css,scss}": ["prettier --write"]
}
```

## 故障排除

### 常见问题

1. **ESLint报错**
   - 运行 `pnpm run lint:fix` 自动修复
   - 检查规则配置是否合适

2. **Prettier格式问题**
   - 运行 `pnpm run format` 自动格式化
   - 检查 `.prettierrc` 配置

3. **Git钩子不工作**
   - 确保 `.husky/` 目录存在
   - 重新安装依赖：`pnpm install`

4. **提交消息被拒绝**
   - 检查消息格式是否符合规范
   - 查看 `commitlint.config.js` 配置

### 重置配置

如果需要重置Git钩子：

```bash
npx husky init
```

## 扩展配置

### 添加新的ESLint规则

编辑 `eslint.config.mjs` 文件的 `rules` 部分。

### 修改Prettier格式

编辑 `.prettierrc` 文件。

### 添加新的Git钩子

在 `.husky/` 目录下创建新的钩子文件。

### 自定义lint-staged规则

编辑 `package.json` 中的 `lint-staged` 配置。
