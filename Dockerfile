# ==============================================
# 班主任班级管理平台 - 生产环境 Dockerfile
# ==============================================

FROM node:22-alpine AS base

# 设置 pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# 安装依赖阶段
FROM base AS deps

# 复制依赖配置文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# 安装生产依赖
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

# 构建阶段
FROM base AS builder

# 复制依赖配置文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# 安装所有依赖（包括开发依赖）
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 复制 Prisma schema
COPY prisma ./prisma/

# 生成 Prisma Client
RUN pnpm db:generate

# 复制环境配置文件（用于构建时读取 NEXT_PUBLIC_* 变量）
# 支持 .env 和 .env.production 文件
COPY .env* ./

# 构建 Next.js 应用
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# 运行时阶段
FROM base AS runner

WORKDIR /app

# 设置生产环境
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制必要的文件
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts

# 复制构建产物和依赖
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules

# 设置正确的权限
RUN mkdir -p .next
RUN chown nextjs:nodejs .next

# 复制构建产物
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 创建上传目录
RUN mkdir -p uploads/avatars uploads/images uploads/files
RUN chown -R nextjs:nodejs uploads

# 切换到非 root 用户
USER nextjs

# 暴露端口
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 启动应用
CMD ["node", "server.js"]
