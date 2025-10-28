#!/bin/bash

# ==============================================
# 班主任班级管理平台 - 生产环境部署脚本
# ==============================================

set -e

echo "🚀 开始部署班主任班级管理平台..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查必要文件
check_required_files() {
    echo "📋 检查必要文件..."
    
    if [ ! -f ".env.production" ]; then
        echo -e "${RED}❌ 错误: .env.production 文件不存在${NC}"
        echo "请先复制 .env.production.example 并配置环境变量"
        exit 1
    fi
    
    if [ ! -f "docker-compose.prod.yml" ]; then
        echo -e "${RED}❌ 错误: docker-compose.prod.yml 文件不存在${NC}"
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

# 备份数据库
backup_database() {
    echo "💾 备份数据库..."
    
    BACKUP_DIR="./backups"
    mkdir -p "$BACKUP_DIR"
    
    BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"
    
    if docker ps | grep -q "class-tool-postgres-prod"; then
        docker exec class-tool-postgres-prod pg_dump -U postgres class_tool > "$BACKUP_FILE" 2>/dev/null || true
        if [ -f "$BACKUP_FILE" ]; then
            echo -e "${GREEN}✅ 数据库备份完成: $BACKUP_FILE${NC}"
        else
            echo -e "${YELLOW}⚠️  跳过数据库备份（可能是首次部署）${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  数据库容器未运行，跳过备份${NC}"
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
    
    # 加载环境变量
    export $(cat .env.production | grep -v '^#' | xargs)
    
    # 停止现有服务
    echo "停止现有服务..."
    docker-compose -f docker-compose.prod.yml down || true
    
    # 构建新镜像
    echo "构建 Docker 镜像..."
    docker-compose -f docker-compose.prod.yml build --no-cache
    
    # 启动服务
    echo "启动服务..."
    docker-compose -f docker-compose.prod.yml up -d
    
    echo -e "${GREEN}✅ 服务部署完成${NC}"
}

# 运行数据库迁移
run_migrations() {
    echo "🔄 运行数据库迁移..."
    
    # 等待数据库就绪
    echo "等待数据库启动..."
    sleep 10
    
    # 运行 Prisma 迁移
    docker-compose -f docker-compose.prod.yml exec -T app sh -c "pnpm db:push" || {
        echo -e "${YELLOW}⚠️  数据库迁移失败，请检查日志${NC}"
    }
    
    echo -e "${GREEN}✅ 数据库迁移完成${NC}"
}

# 运行种子数据（仅首次部署）
seed_database() {
    read -p "是否需要初始化种子数据？(y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🌱 初始化种子数据..."
        docker-compose -f docker-compose.prod.yml exec -T app sh -c "pnpm db:seed"
        echo -e "${GREEN}✅ 种子数据初始化完成${NC}"
    fi
}

# 健康检查
health_check() {
    echo "🏥 执行健康检查..."
    
    sleep 5
    
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
    echo "等待应用启动..."
    for i in {1..30}; do
        if curl -f http://localhost:3000/api/health &> /dev/null; then
            echo -e "${GREEN}✅ 应用健康检查通过${NC}"
            return 0
        fi
        echo -n "."
        sleep 2
    done
    
    echo -e "${RED}❌ 应用健康检查失败${NC}"
    echo "请查看日志: docker-compose -f docker-compose.prod.yml logs app"
    exit 1
}

# 显示部署信息
show_info() {
    echo ""
    echo "========================================="
    echo "🎉 部署完成！"
    echo "========================================="
    echo ""
    echo "📊 服务状态:"
    docker-compose -f docker-compose.prod.yml ps
    echo ""
    echo "🌐 访问地址: ${NEXT_PUBLIC_APP_URL:-http://localhost:3000}"
    echo ""
    echo "📝 常用命令:"
    echo "  查看日志: docker-compose -f docker-compose.prod.yml logs -f"
    echo "  停止服务: docker-compose -f docker-compose.prod.yml down"
    echo "  重启服务: docker-compose -f docker-compose.prod.yml restart"
    echo "  进入容器: docker-compose -f docker-compose.prod.yml exec app sh"
    echo ""
}

# 主流程
main() {
    check_required_files
    check_docker
    backup_database
    pull_code
    deploy_services
    run_migrations
    seed_database
    health_check
    show_info
}

# 执行主流程
main
