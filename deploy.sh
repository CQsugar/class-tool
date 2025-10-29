#!/bin/bash

# ==============================================
# 班主任班级管理平台 - 生产环境一键部署脚本
# 版本: 2.0 (支持 Traefik 自动 HTTPS)
# ==============================================

set -e

echo "🚀 开始部署班主任班级管理平台 (Traefik + 自动HTTPS)..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查必要文件
check_required_files() {
    echo "📋 检查必要文件..."
    
    # 检查环境配置文件
    if [ ! -f ".env.production" ]; then
        echo -e "${RED}❌ 错误: .env.production 文件不存在${NC}"
        echo -e "${YELLOW}💡 提示: 请先复制并配置环境变量${NC}"
        echo "cp .env.production.example .env.production"
        echo "nano .env.production"
        exit 1
    fi
    
    # 检查 Docker Compose 文件
    if [ ! -f "docker-compose.prod.yml" ]; then
        echo -e "${RED}❌ 错误: docker-compose.prod.yml 文件不存在${NC}"
        exit 1
    fi
    
    # 检查 Traefik 配置文件
    if [ ! -f "traefik.toml" ]; then
        echo -e "${RED}❌ 错误: traefik.toml 文件不存在${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ 必要文件检查完成${NC}"
}

# 检查 Docker 环境
check_docker() {
    echo "🐳 检查 Docker 环境..."
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ 错误: Docker 未安装${NC}"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo -e "${RED}❌ 错误: Docker Compose 未安装${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Docker 环境检查完成${NC}"
}

# 验证环境配置
validate_env() {
    echo "� 验证环境配置..."
    
    # 加载环境变量
    source .env.production
    
    # 检查关键配置
    if [[ "$DOMAIN" == "your-domain.com" ]] || [[ -z "$DOMAIN" ]]; then
        echo -e "${RED}❌ 错误: 请配置正确的域名 (DOMAIN)${NC}"
        exit 1
    fi
    
    if [[ "$POSTGRES_PASSWORD" == "YOUR_STRONG_PASSWORD_HERE_CHANGE_ME" ]] || [[ -z "$POSTGRES_PASSWORD" ]]; then
        echo -e "${RED}❌ 错误: 请设置强数据库密码 (POSTGRES_PASSWORD)${NC}"
        exit 1
    fi
    
    if [[ "$BETTER_AUTH_SECRET" == "CHANGE_THIS_TO_A_STRONG_SECRET_KEY_MIN_32_CHARS_USE_OPENSSL_RAND_HEX_32" ]] || [[ -z "$BETTER_AUTH_SECRET" ]]; then
        echo -e "${RED}❌ 错误: 请设置认证密钥 (BETTER_AUTH_SECRET)${NC}"
        echo -e "${YELLOW}💡 提示: 使用 openssl rand -hex 32 生成${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ 环境配置验证完成${NC}"
    echo -e "${BLUE}📍 部署域名: ${DOMAIN}${NC}"
}

# 准备数据目录
prepare_data_dirs() {
    echo "📁 准备数据目录..."
    
    # 加载数据目录配置
    source .env.production
    DATA_DIR=${DATA_DIR:-./data}
    
    # 创建必要的数据目录
    mkdir -p "${DATA_DIR}/postgres"
    mkdir -p "${DATA_DIR}/uploads"
    mkdir -p "${DATA_DIR}/letsencrypt"
    mkdir -p "./backups"
    
    # 设置 Let's Encrypt 证书存储文件权限
    touch "${DATA_DIR}/letsencrypt/acme.json"
    chmod 600 "${DATA_DIR}/letsencrypt/acme.json"
    
    echo -e "${GREEN}✅ 数据目录准备完成: ${DATA_DIR}${NC}"
}

# 备份数据库
backup_database() {
    echo "💾 备份现有数据库..."
    
    if docker ps | grep -q "class-tool-postgres-prod"; then
        echo "发现运行中的数据库，正在备份..."
        ./scripts/backup.sh || {
            echo -e "${YELLOW}⚠️  自动备份失败，继续部署...${NC}"
        }
    else
        echo -e "${YELLOW}⚠️  数据库容器未运行，跳过备份（可能是首次部署）${NC}"
    fi
}

# 拉取最新代码
pull_code() {
    echo "📥 拉取最新代码..."
    
    if [ -d ".git" ]; then
        git pull origin main || git pull origin master
        echo -e "${GREEN}✅ 代码更新完成${NC}"
    else
        echo -e "${YELLOW}⚠️  不是 Git 仓库，跳过代码拉取${NC}"
    fi
}

# 构建和启动服务
deploy_services() {
    echo "🔨 构建和启动服务..."
    
    # 停止现有服务
    echo "停止现有服务..."
    docker compose -f docker-compose.prod.yml down || true
    
    # 构建新镜像（无缓存，确保最新代码）
    echo "构建 Docker 镜像..."
    docker compose -f docker-compose.prod.yml build --no-cache --pull
    
    # 启动所有服务
    echo "启动服务..."
    echo "  - Traefik (反向代理 + 自动HTTPS)"
    echo "  - PostgreSQL (数据库)"
    echo "  - Next.js App (应用服务)"
    
    docker compose -f docker-compose.prod.yml up -d
    
    echo -e "${GREEN}✅ 服务部署完成${NC}"
}

# 等待服务就绪
wait_for_services() {
    echo "⏳ 等待服务就绪..."
    
    # 等待数据库健康检查通过
    echo "等待数据库启动..."
    for i in {1..30}; do
        if docker compose -f docker-compose.prod.yml exec -T postgres pg_isready -U postgres >/dev/null 2>&1; then
            echo -e "${GREEN}✅ 数据库就绪${NC}"
            break
        fi
        echo -n "."
        sleep 2
    done
    
    # 等待应用服务启动
    echo "等待应用服务启动..."
    sleep 5
    
    echo -e "${GREEN}✅ 服务启动完成${NC}"
}

# 运行数据库迁移
run_migrations() {
    echo "🔄 运行数据库迁移..."
    
    # 运行 Prisma 数据库推送
    docker compose -f docker-compose.prod.yml exec -T app sh -c "pnpm db:push" || {
        echo -e "${RED}❌ 数据库迁移失败${NC}"
        echo "请查看日志: docker compose -f docker-compose.prod.yml logs app"
        exit 1
    }
    
    echo -e "${GREEN}✅ 数据库迁移完成${NC}"
}

# 运行种子数据（仅首次部署）
seed_database() {
    # 检查是否已有用户数据
    user_count=$(docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d class_tool -t -c "SELECT COUNT(*) FROM \"User\";" 2>/dev/null | tr -d ' \n' || echo "0")
    
    if [ "$user_count" -gt 0 ]; then
        echo -e "${YELLOW}⚠️  检测到现有用户数据，跳过种子数据初始化${NC}"
        return 0
    fi
    
    echo -e "${BLUE}❓ 是否需要初始化种子数据？${NC}"
    echo "   - 创建管理员账户"
    echo "   - 生成示例数据（开发环境）"
    read -p "初始化种子数据？(y/N) " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🌱 初始化种子数据..."
        docker compose -f docker-compose.prod.yml exec -T app sh -c "pnpm db:seed" || {
            echo -e "${RED}❌ 种子数据初始化失败${NC}"
            echo "请查看日志: docker compose -f docker-compose.prod.yml logs app"
            return 1
        }
        echo -e "${GREEN}✅ 种子数据初始化完成${NC}"
        echo -e "${YELLOW}⚠️  请保存管理员密码信息！${NC}"
    fi
}

# 健康检查
health_check() {
    echo "🏥 执行全面健康检查..."
    
    # 检查容器状态
    echo "检查容器状态..."
    
    # 检查 Traefik 容器
    if docker ps | grep -q "class-tool-traefik"; then
        echo -e "${GREEN}✅ Traefik 容器运行正常${NC}"
    else
        echo -e "${RED}❌ Traefik 容器未运行${NC}"
        exit 1
    fi
    
    # 检查应用容器
    if docker ps | grep -q "class-tool-app-prod"; then
        echo -e "${GREEN}✅ 应用容器运行正常${NC}"
    else
        echo -e "${RED}❌ 应用容器未运行${NC}"
        exit 1
    fi
    
    # 检查数据库容器
    if docker ps | grep -q "class-tool-postgres-prod"; then
        echo -e "${GREEN}✅ 数据库容器运行正常${NC}"
    else
        echo -e "${RED}❌ 数据库容器未运行${NC}"
        exit 1
    fi
    
    # 检查应用健康状态
    source .env.production
    APP_URL=${NEXT_PUBLIC_APP_URL:-https://$DOMAIN}
    
    echo "等待应用完全启动..."
    for i in {1..60}; do
        # 先检查本地健康端点
        if docker compose -f docker-compose.prod.yml exec -T app wget -q --spider http://localhost:3000/api/health 2>/dev/null; then
            echo -e "${GREEN}✅ 应用内部健康检查通过${NC}"
            break
        fi
        echo -n "."
        sleep 3
    done
    
    # 检查 HTTPS 访问（如果域名已配置）
    if [[ "$DOMAIN" != "localhost" ]] && command -v curl >/dev/null; then
        echo "测试 HTTPS 访问..."
        if curl -f -s --max-time 10 "$APP_URL/api/health" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ HTTPS 访问正常${NC}"
        else
            echo -e "${YELLOW}⚠️  HTTPS 访问失败，可能需要等待 SSL 证书生成${NC}"
            echo -e "${BLUE}💡 这通常需要几分钟时间，请稍后再试${NC}"
        fi
    fi
    
    echo -e "${GREEN}✅ 健康检查完成${NC}"
}

# 显示部署信息
show_info() {
    source .env.production
    
    echo ""
    echo "========================================="
    echo "🎉 部署完成！班主任班级管理平台已启动"
    echo "========================================="
    echo ""
    echo "📊 服务状态:"
    docker compose -f docker-compose.prod.yml ps
    echo ""
    echo "🌐 访问地址:"
    echo "  应用主页: ${NEXT_PUBLIC_APP_URL:-https://$DOMAIN}"
    if [[ "$DOMAIN" != "localhost" ]]; then
        echo "  Traefik 监控: https://traefik.${DOMAIN} (admin/admin)"
    fi
    echo ""
    echo "🔐 安全提醒:"
    echo "  1. 修改 Traefik Dashboard 默认密码"
    echo "  2. 定期备份数据库数据"
    echo "  3. 监控 SSL 证书自动续期状态"
    echo ""
    echo "📁 数据目录: ${DATA_DIR:-./data}"
    echo "  - postgres: 数据库文件"
    echo "  - uploads: 用户上传文件"
    echo "  - letsencrypt: SSL 证书"
    echo ""
    echo "📝 常用运维命令:"
    echo "  查看所有日志: docker compose -f docker-compose.prod.yml logs -f"
    echo "  查看应用日志: docker compose -f docker-compose.prod.yml logs -f app"
    echo "  查看 Traefik 日志: docker compose -f docker-compose.prod.yml logs -f traefik"
    echo "  重启所有服务: docker compose -f docker-compose.prod.yml restart"
    echo "  重启单个服务: docker compose -f docker-compose.prod.yml restart app"
    echo "  停止所有服务: docker compose -f docker-compose.prod.yml down"
    echo "  进入应用容器: docker compose -f docker-compose.prod.yml exec app sh"
    echo "  备份数据库: ./scripts/backup.sh"
    echo "  恢复数据库: ./scripts/restore.sh <backup-file>"
    echo ""
    echo "🚨 如遇问题，请查看部署文档: docs/deployment-guide.md"
    echo ""
}

# 显示使用说明
show_usage() {
    echo "班主任班级管理平台 - 一键部署脚本"
    echo ""
    echo "使用方法:"
    echo "  $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help     显示此帮助信息"
    echo "  --no-backup    跳过数据库备份"
    echo "  --no-seed      跳过种子数据初始化"
    echo "  --no-pull      跳过代码拉取"
    echo ""
    echo "示例:"
    echo "  $0                 # 完整部署流程"
    echo "  $0 --no-backup     # 跳过备份的快速部署"
    echo "  $0 --no-seed       # 跳过种子数据的部署"
    echo ""
}

# 解析命令行参数
parse_args() {
    SKIP_BACKUP=false
    SKIP_SEED=false
    SKIP_PULL=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
            ;;
            --no-backup)
                SKIP_BACKUP=true
                shift
            ;;
            --no-seed)
                SKIP_SEED=true
                shift
            ;;
            --no-pull)
                SKIP_PULL=true
                shift
            ;;
            *)
                echo -e "${RED}❌ 未知选项: $1${NC}"
                show_usage
                exit 1
            ;;
        esac
    done
}

# 主流程
main() {
    echo -e "${BLUE}班主任班级管理平台 - 一键部署脚本 v2.0${NC}"
    echo ""
    
    # 基础检查
    check_required_files
    check_docker
    validate_env
    prepare_data_dirs
    
    # 数据备份（可选）
    if [ "$SKIP_BACKUP" != true ]; then
        backup_database
    else
        echo -e "${YELLOW}⚠️  跳过数据库备份${NC}"
    fi
    
    # 代码拉取（可选）
    if [ "$SKIP_PULL" != true ]; then
        pull_code
    else
        echo -e "${YELLOW}⚠️  跳过代码拉取${NC}"
    fi
    
    # 部署服务
    deploy_services
    wait_for_services
    run_migrations
    
    # 种子数据（可选）
    if [ "$SKIP_SEED" != true ]; then
        seed_database
    else
        echo -e "${YELLOW}⚠️  跳过种子数据初始化${NC}"
    fi
    
    # 健康检查和信息显示
    health_check
    show_info
}

# 脚本入口
parse_args "$@"
main
