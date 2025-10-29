# ==============================================
# 班主任班级管理平台 - 生产环境 Dockerfile
# 基于 Next.js 官方推荐的 Docker 最佳实践
# ==============================================

FROM node:22-alpine AS base


# 安装依赖阶段
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* .npmrc* ./
RUN corepack enable pnpm
RUN pnpm i --frozen-lockfile

# 构建阶段
FROM base AS builder
WORKDIR /app

# 从 deps 阶段复制已安装的 node_modules
COPY --from=deps /app/node_modules ./node_modules

# 复制所有源代码
COPY . .

# 复制环境配置文件（用于构建时读取 NEXT_PUBLIC_* 变量）
COPY .env* ./

RUN corepack enable pnpm

# 生成 Prisma Client
RUN pnpm db:generate

# 禁用 Next.js 遥测并构建应用
ENV NEXT_TELEMETRY_DISABLED=1
# build
RUN pnpm run build

# 运行时阶段
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 创建系统用户和用户组
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制公共资源
COPY --from=builder /app/public ./public

# 自动利用输出跟踪来减少镜像大小
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 复制 Prisma 相关文件（如果存在）
COPY --from=builder /app/prisma ./prisma

# 创建上传目录
RUN mkdir -p uploads/avatars uploads/images uploads/files
RUN chown -R nextjs:nodejs uploads

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 启动应用
CMD ["node", "server.js"]
