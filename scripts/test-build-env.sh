#!/bin/bash

# ==============================================
# 测试 Docker 构建时环境变量传递
# ==============================================

set -e

echo "🧪 测试构建时环境变量..."

# 检查环境变量文件
if [ -f ".env.production" ]; then
    source .env.production
    echo "✅ 已找到 .env.production"
    elif [ -f ".env" ]; then
    source .env
    echo "✅ 已找到 .env (开发环境)"
else
    echo "❌ 未找到环境变量文件"
    echo "请创建 .env.production 或确保在开发环境中有 .env 文件"
    exit 1
fi

# 检查关键的 NEXT_PUBLIC_ 变量
echo ""
echo "📋 当前 NEXT_PUBLIC_ 环境变量:"
echo "NEXT_PUBLIC_APP_URL = ${NEXT_PUBLIC_APP_URL:-未设置}"
echo "NEXT_PUBLIC_DISABLE_SIGNUP = ${NEXT_PUBLIC_DISABLE_SIGNUP:-未设置}"
echo "NEXT_PUBLIC_ICP_NUMBER = ${NEXT_PUBLIC_ICP_NUMBER:-未设置}"
echo "NEXT_PUBLIC_MAX_FILE_SIZE = ${NEXT_PUBLIC_MAX_FILE_SIZE:-未设置}"

# 测试构建
echo ""
echo "🔨 测试构建（仅构建，不启动）..."

# 构建测试
docker compose -f docker-compose.prod.yml build app || {
    echo "❌ 构建失败"
    exit 1
}

echo "✅ 构建测试完成"

# 检查构建产物中是否包含环境变量
echo ""
echo "🔍 验证构建结果..."

# 检查构建产物中是否包含 ICP 备案号（验证 NEXT_PUBLIC_ 变量被正确编译）
echo "检查 NEXT_PUBLIC_ 变量是否被编译到构建产物中:"

# 检查 ICP 备案号
if docker run --rm class-tool-app find /app/.next -name "*.js" -exec grep -l "${NEXT_PUBLIC_ICP_NUMBER}" {} \; 2>/dev/null | head -1; then
    echo "✅ ICP备案号已编译到构建产物中"
else
    echo "⚠️  未在构建产物中找到 ICP 备案号"
fi

# 检查应用 URL
if docker run --rm class-tool-app find /app/.next -name "*.js" -exec grep -l "${NEXT_PUBLIC_APP_URL}" {} \; 2>/dev/null | head -1; then
    echo "✅ 应用 URL 已编译到构建产物中"
else
    echo "⚠️  未在构建产物中找到应用 URL"
fi

echo "✅ 构建产物验证完成"

echo ""
echo "🎉 测试完成"