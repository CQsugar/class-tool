# 开发环境设置

## Git Hooks 和代码质量工具

本项目使用 Husky + lint-staged 来确保代码质量和一致性。

### 🔧 首次设置（新电脑/新克隆）

1. **安装依赖**：

   ```bash
   pnpm install
   ```

   这会自动运行 `prepare` 脚本并初始化 Husky。

2. **验证 Git Hooks 是否工作**：

   ```bash
   git config core.hooksPath
   ```

   应该输出：`.husky/_`

3. **如果上述命令没有输出，手动初始化**：
   ```bash
   npx husky init
   ```

### 📋 自动化功能

#### Pre-commit Hook

在每次提交前自动运行：

- **ESLint** - 检查并修复代码问题
- **Prettier** - 统一代码格式
- **TypeScript检查** - 类型检查

#### Commit Message Hook

验证提交消息格式符合 [Conventional Commits](https://www.conventionalcommits.org/)：

```
feat: 添加新功能
fix: 修复bug
docs: 更新文档
style: 代码格式调整
refactor: 重构代码
test: 添加测试
chore: 构建过程或辅助工具的变动
```

### 🛠️ 手动运行工具

```bash
# 检查代码质量
pnpm lint

# 修复代码问题
pnpm lint:fix

# 格式化代码
pnpm format

# 检查格式
pnpm format:check

# 类型检查
pnpm check:types

# 运行所有检查
pnpm check:all
```

### 📂 配置文件

- **Husky**: `.husky/` 目录
- **lint-staged**: `package.json` 中的 `lint-staged` 字段
- **ESLint**: `eslint.config.mjs`
- **Prettier**: `.prettierrc` (如果存在) 或 `package.json`
- **CommitLint**: `commitlint.config.js`

### ⚠️ 故障排除

如果 Git Hooks 不工作：

1. **检查 hooks 路径**：

   ```bash
   git config core.hooksPath
   ```

2. **重新初始化 Husky**：

   ```bash
   npx husky init
   ```

3. **检查文件权限**：

   ```bash
   ls -la .husky/
   ```

   钩子文件应该有执行权限 (`-rwxrwxr-x`)

4. **手动测试 lint-staged**：
   ```bash
   npx lint-staged
   ```

### 🎯 为什么需要重新设置？

- `core.hooksPath` 配置存储在本地 `.git/config` 文件中
- `.git` 目录不会被 Git 跟踪或推送到远程仓库
- 每个开发者在新环境中都需要重新配置

但是通过 `package.json` 中的 `prepare` 脚本，这个过程已经自动化了！
