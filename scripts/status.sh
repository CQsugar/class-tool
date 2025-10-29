#!/bin/bash

# ==============================================
# 班主任班级管理平台 - 系统状态检查脚本
# ==============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 检查 Docker 服务状态
check_docker_status() {
    echo -e "${BLUE}🐳 Docker 服务状态${NC}"
    echo "----------------------------------------"
    
    if systemctl is-active --quiet docker; then
        echo -e "${GREEN}✅ Docker 服务运行正常${NC}"
    else
        echo -e "${RED}❌ Docker 服务未运行${NC}"
        return 1
    fi
    
    echo ""
}

# 检查容器状态
check_containers() {
    echo -e "${BLUE}📦 容器状态${NC}"
    echo "----------------------------------------"
    
    # 检查容器是否存在并运行
    containers=("class-tool-traefik" "class-tool-app-prod" "class-tool-postgres-prod")
    
    for container in "${containers[@]}"; do
        if docker ps --format "table {{.Names}}" | grep -q "^${container}$"; then
            # 获取容器状态
            status=$(docker inspect --format='{{.State.Status}}' "$container" 2>/dev/null || echo "not found")
            health=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "none")
            
            if [ "$status" = "running" ]; then
                if [ "$health" = "healthy" ] || [ "$health" = "none" ]; then
                    echo -e "${GREEN}✅ $container: 运行中${NC}"
                else
                    echo -e "${YELLOW}⚠️  $container: 运行中但健康检查失败 ($health)${NC}"
                fi
            else
                echo -e "${RED}❌ $container: $status${NC}"
            fi
        else
            echo -e "${RED}❌ $container: 未找到${NC}"
        fi
    done
    
    echo ""
}

# 检查端口状态
check_ports() {
    echo -e "${BLUE}🌐 端口状态${NC}"
    echo "----------------------------------------"
    
    ports=(80 443)
    
    for port in "${ports[@]}"; do
        if ss -tlun | grep -q ":${port} "; then
            process=$(ss -tlnp | grep ":${port} " | awk '{print $NF}' | head -1)
            echo -e "${GREEN}✅ 端口 $port: 已监听 ($process)${NC}"
        else
            echo -e "${RED}❌ 端口 $port: 未监听${NC}"
        fi
    done
    
    echo ""
}

# 检查数据库连接
check_database() {
    echo -e "${BLUE}🗄️  数据库状态${NC}"
    echo "----------------------------------------"
    
    if docker ps | grep -q "class-tool-postgres-prod"; then
        if docker exec class-tool-postgres-prod pg_isready -U postgres >/dev/null 2>&1; then
            # 获取数据库信息
            db_size=$(docker exec class-tool-postgres-prod psql -U postgres -d class_tool -t -c "SELECT pg_size_pretty(pg_database_size('class_tool'));" 2>/dev/null | tr -d ' \n' || echo "未知")
            user_count=$(docker exec class-tool-postgres-prod psql -U postgres -d class_tool -t -c "SELECT COUNT(*) FROM \"User\";" 2>/dev/null | tr -d ' \n' || echo "0")
            
            echo -e "${GREEN}✅ 数据库连接正常${NC}"
            echo "数据库大小: $db_size"
            echo "用户数量: $user_count"
        else
            echo -e "${RED}❌ 数据库连接失败${NC}"
        fi
    else
        echo -e "${RED}❌ 数据库容器未运行${NC}"
    fi
    
    echo ""
}

# 检查应用健康状态
check_application() {
    echo -e "${BLUE}🚀 应用状态${NC}"
    echo "----------------------------------------"
    
    # 检查内部健康端点
    if docker compose -f docker-compose.prod.yml exec -T app wget -q --spider http://localhost:3000/api/health 2>/dev/null; then
        echo -e "${GREEN}✅ 应用内部健康检查通过${NC}"
    else
        echo -e "${RED}❌ 应用内部健康检查失败${NC}"
    fi
    
    # 检查外部访问（如果配置了域名）
    if [ -f ".env.production" ]; then
        source .env.production
        if [[ "$DOMAIN" != "localhost" ]] && command -v curl >/dev/null; then
            if curl -f -s --max-time 10 "https://$DOMAIN/api/health" >/dev/null 2>&1; then
                echo -e "${GREEN}✅ HTTPS 外部访问正常${NC}"
            else
                echo -e "${YELLOW}⚠️  HTTPS 外部访问失败${NC}"
            fi
        fi
    fi
    
    echo ""
}

# 检查 SSL 证书状态
check_ssl_certificates() {
    echo -e "${BLUE}🔒 SSL 证书状态${NC}"
    echo "----------------------------------------"
    
    if [ -f ".env.production" ]; then
        source .env.production
        data_dir=${DATA_DIR:-./data}
        
        if [ -f "${data_dir}/letsencrypt/acme.json" ]; then
            cert_count=$(cat "${data_dir}/letsencrypt/acme.json" | grep -o '"certificate":' | wc -l 2>/dev/null || echo "0")
            echo "Let's Encrypt 证书数量: $cert_count"
            
            if [ "$cert_count" -gt 0 ]; then
                echo -e "${GREEN}✅ SSL 证书已配置${NC}"
                
                # 检查证书有效期（如果域名可访问）
                if [[ "$DOMAIN" != "localhost" ]] && command -v openssl >/dev/null; then
                    expiry=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2 || echo "无法获取")
                    echo "证书过期时间: $expiry"
                fi
            else
                echo -e "${YELLOW}⚠️  SSL 证书未配置或生成中${NC}"
            fi
        else
            echo -e "${YELLOW}⚠️  未找到 SSL 证书文件${NC}"
        fi
    fi
    
    echo ""
}

# 检查系统资源
check_system_resources() {
    echo -e "${BLUE}💻 系统资源${NC}"
    echo "----------------------------------------"
    
    # CPU 使用率
    cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1 || echo "未知")
    echo "CPU 使用率: ${cpu_usage}%"
    
    # 内存使用率
    memory_info=$(free -h | grep '^Mem:')
    memory_used=$(echo $memory_info | awk '{print $3}')
    memory_total=$(echo $memory_info | awk '{print $2}')
    echo "内存使用: $memory_used / $memory_total"
    
    # 磁盘使用率
    disk_usage=$(df -h / | tail -1 | awk '{print $5}')
    echo "根分区使用率: $disk_usage"
    
    # Docker 资源使用
    if command -v docker >/dev/null; then
        docker_size=$(docker system df --format "table {{.Type}}\t{{.Size}}" 2>/dev/null | grep Total | awk '{print $2}' || echo "未知")
        echo "Docker 占用空间: $docker_size"
    fi
    
    echo ""
}

# 检查备份状态
check_backups() {
    echo -e "${BLUE}💾 备份状态${NC}"
    echo "----------------------------------------"
    
    backup_dir="./backups"
    
    if [ -d "$backup_dir" ]; then
        backup_count=$(find "$backup_dir" -name "backup_*.sql*" 2>/dev/null | wc -l)
        backup_size=$(du -sh "$backup_dir" 2>/dev/null | cut -f1 || echo "0")
        
        echo "备份文件数量: $backup_count"
        echo "备份总大小: $backup_size"
        
        if [ "$backup_count" -gt 0 ]; then
            latest_backup=$(find "$backup_dir" -name "backup_*.sql*" -printf "%T@ %p\n" 2>/dev/null | sort -nr | head -1 | cut -d' ' -f2)
            latest_date=$(stat -c %y "$latest_backup" 2>/dev/null | cut -d' ' -f1 || echo "未知")
            echo "最新备份: $(basename "$latest_backup") ($latest_date)"
            
            # 检查最新备份是否在24小时内
            if [ -n "$latest_backup" ] && [ -f "$latest_backup" ]; then
                latest_timestamp=$(stat -c %Y "$latest_backup" 2>/dev/null || echo "0")
                current_timestamp=$(date +%s)
                hours_diff=$(( (current_timestamp - latest_timestamp) / 3600 ))
                
                if [ "$hours_diff" -lt 24 ]; then
                    echo -e "${GREEN}✅ 备份较新 (${hours_diff}小时前)${NC}"
                else
                    echo -e "${YELLOW}⚠️  备份较旧 (${hours_diff}小时前)${NC}"
                fi
            fi
        else
            echo -e "${YELLOW}⚠️  没有找到备份文件${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  备份目录不存在${NC}"
    fi
    
    echo ""
}

# 显示快速操作提示
show_quick_actions() {
    echo -e "${BLUE}🛠️  快速操作${NC}"
    echo "----------------------------------------"
    echo "查看日志: docker compose -f docker-compose.prod.yml logs -f"
    echo "重启服务: docker compose -f docker-compose.prod.yml restart"
    echo "创建备份: ./scripts/backup.sh"
    echo "更新部署: ./deploy.sh"
    echo ""
}

# 主函数
main() {
    echo -e "${BLUE}班主任班级管理平台 - 系统状态检查${NC}"
    echo ""
    echo "检查时间: $(date)"
    echo ""
    
    # 执行所有检查
    check_docker_status
    check_containers
    check_ports
    check_database
    check_application
    check_ssl_certificates
    check_system_resources
    check_backups
    show_quick_actions
    
    echo -e "${GREEN}🎉 状态检查完成${NC}"
}

# 脚本入口
main