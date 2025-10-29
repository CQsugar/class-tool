#!/bin/bash

# ==============================================
# 环境变量配置检查脚本
# ==============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 检查环境变量配置...${NC}"

# 检查 .env.production 文件是否存在
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ .env.production 文件不存在${NC}"
    exit 1
fi

# 加载环境变量
set -a
source .env.production
set +a

# 必需的环境变量列表
REQUIRED_VARS=(
    "DOMAIN"
    "POSTGRES_PASSWORD"
    "BETTER_AUTH_SECRET"
    "BETTER_AUTH_URL"
    "NEXT_PUBLIC_APP_URL"
)

# 检查每个必需变量
echo -e "${BLUE}📋 检查必需环境变量:${NC}"
all_good=true

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}❌ $var: 未设置${NC}"
        all_good=false
        elif [[ "${!var}" == *"CHANGE"* || "${!var}" == *"your-domain"* || "${!var}" == *"YOUR_"* ]]; then
        echo -e "${YELLOW}⚠️  $var: 使用默认值，需要修改${NC}"
        echo "   当前值: ${!var}"
        all_good=false
    else
        echo -e "${GREEN}✅ $var: 已配置${NC}"
    fi
done

# 检查密码强度
if [ -n "$POSTGRES_PASSWORD" ]; then
    if [ ${#POSTGRES_PASSWORD} -lt 12 ]; then
        echo -e "${YELLOW}⚠️  POSTGRES_PASSWORD: 密码长度建议至少 12 个字符${NC}"
        all_good=false
    fi
fi

# 检查认证密钥长度
if [ -n "$BETTER_AUTH_SECRET" ]; then
    if [ ${#BETTER_AUTH_SECRET} -lt 32 ]; then
        echo -e "${YELLOW}⚠️  BETTER_AUTH_SECRET: 密钥长度建议至少 32 个字符${NC}"
        all_good=false
    fi
fi

# 检查 URL 格式
if [ -n "$BETTER_AUTH_URL" ]; then
    if [[ ! "$BETTER_AUTH_URL" =~ ^https?:// ]]; then
        echo -e "${YELLOW}⚠️  BETTER_AUTH_URL: 应该以 http:// 或 https:// 开头${NC}"
        all_good=false
    fi
fi

if [ -n "$NEXT_PUBLIC_APP_URL" ]; then
    if [[ ! "$NEXT_PUBLIC_APP_URL" =~ ^https?:// ]]; then
        echo -e "${YELLOW}⚠️  NEXT_PUBLIC_APP_URL: 应该以 http:// 或 https:// 开头${NC}"
        all_good=false
    fi
fi

echo ""
if [ "$all_good" = true ]; then
    echo -e "${GREEN}🎉 环境变量配置检查通过！${NC}"
else
    echo -e "${RED}❌ 发现配置问题，请修复后重试${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}📝 当前配置摘要:${NC}"
echo "  域名: $DOMAIN"
echo "  应用URL: $NEXT_PUBLIC_APP_URL"
echo "  认证URL: $BETTER_AUTH_URL"
echo "  数据库用户: $POSTGRES_USER"
echo "  数据库名: $POSTGRES_DB"
echo "  认证密钥长度: ${#BETTER_AUTH_SECRET} 字符"
echo "  数据库密码长度: ${#POSTGRES_PASSWORD} 字符"