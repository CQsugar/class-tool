#!/bin/bash

# ==============================================
# 班主任班级管理平台 - 系统维护脚本
# ==============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 显示使用说明
show_usage() {
    echo "系统维护脚本"
    echo ""
    echo "使用方法:"
    echo "  $0 <操作> [选项]"
    echo ""
    echo "可用操作:"
    echo "  cleanup         清理系统垃圾文件和缓存"
    echo "  optimize        优化数据库性能"
    echo "  logs            管理和清理日志文件"
    echo "  update          更新系统和依赖"
    echo "  monitor         显示实时系统监控"
    echo ""
    echo "选项:"
    echo "  -h, --help      显示此帮助信息"
    echo "  --dry-run       预览操作但不执行"
    echo ""
    echo "示例:"
    echo "  $0 cleanup                # 清理系统"
    echo "  $0 optimize --dry-run     # 预览数据库优化"
    echo "  $0 logs                   # 清理日志"
    echo ""
}

# 解析命令行参数
parse_args() {
    ACTION=""
    DRY_RUN=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
            ;;
            --dry-run)
                DRY_RUN=true
                shift
            ;;
            cleanup|optimize|logs|update|monitor)
                ACTION="$1"
                shift
            ;;
            *)
                echo -e "${RED}❌ 未知选项: $1${NC}"
                show_usage
                exit 1
            ;;
        esac
    done
    
    if [ -z "$ACTION" ]; then
        echo -e "${RED}❌ 请指定操作${NC}"
        show_usage
        exit 1
    fi
}

# 执行命令（支持 dry-run）
execute_command() {
    local cmd="$1"
    local desc="$2"
    
    if [ "$DRY_RUN" = true ]; then
        echo -e "${YELLOW}[DRY RUN] $desc${NC}"
        echo -e "${BLUE}命令: $cmd${NC}"
    else
        echo -e "${BLUE}$desc${NC}"
        eval "$cmd"
    fi
}

# 系统清理
cleanup_system() {
    echo -e "${BLUE}🧹 开始系统清理...${NC}"
    echo ""
    
    # 清理 Docker 系统
    echo "清理 Docker 资源..."
    execute_command "docker system prune -af --volumes" "清理未使用的 Docker 资源"
    
    # 清理应用缓存
    echo ""
    echo "清理应用缓存..."
    execute_command "docker compose -f docker-compose.prod.yml exec -T app rm -rf /app/.next/cache/*" "清理 Next.js 缓存"
    
    # 清理旧备份（保留30天）
    echo ""
    echo "清理旧备份文件..."
    execute_command "find ./backups -name 'backup_*.sql*' -mtime +30 -delete" "删除30天前的备份文件"
    execute_command "find ./backups -name 'pre_restore_backup_*.sql*' -mtime +7 -delete" "删除7天前的恢复备份"
    
    # 清理系统临时文件
    echo ""
    echo "清理系统临时文件..."
    execute_command "sudo apt-get autoremove -y" "移除不需要的软件包"
    execute_command "sudo apt-get autoclean" "清理软件包缓存"
    
    # 清理日志文件
    echo ""
    echo "清理系统日志..."
    execute_command "sudo journalctl --vacuum-time=7d" "清理7天前的系统日志"
    
    echo ""
    echo -e "${GREEN}✅ 系统清理完成${NC}"
}

# 数据库优化
optimize_database() {
    echo -e "${BLUE}⚡ 开始数据库优化...${NC}"
    echo ""
    
    # 检查数据库状态
    if ! docker ps | grep -q "class-tool-postgres-prod"; then
        echo -e "${RED}❌ 数据库容器未运行${NC}"
        exit 1
    fi
    
    # 分析和优化表
    echo "分析数据库表..."
    execute_command "docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d class_tool -c 'ANALYZE;'" "分析数据库统计信息"
    
    echo ""
    echo "优化数据库..."
    execute_command "docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d class_tool -c 'VACUUM ANALYZE;'" "清理和分析数据库"
    
    # 重建索引（仅在必要时）
    echo ""
    echo "检查索引状态..."
    execute_command "docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d class_tool -c 'REINDEX DATABASE class_tool;'" "重建数据库索引"
    
    # 显示优化后的统计信息
    if [ "$DRY_RUN" != true ]; then
        echo ""
        echo "优化后的数据库信息:"
        docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres -d class_tool -c "
        SELECT
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
          pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
        "
    fi
    
    echo ""
    echo -e "${GREEN}✅ 数据库优化完成${NC}"
}

# 日志管理
manage_logs() {
    echo -e "${BLUE}📝 开始日志管理...${NC}"
    echo ""
    
    # 显示当前日志大小
    echo "检查容器日志大小..."
    containers=("class-tool-traefik" "class-tool-app-prod" "class-tool-postgres-prod")
    
    for container in "${containers[@]}"; do
        if docker ps --format "{{.Names}}" | grep -q "^${container}$"; then
            log_file=$(docker inspect --format='{{.LogPath}}' "$container" 2>/dev/null || echo "")
            if [ -n "$log_file" ] && [ -f "$log_file" ]; then
                log_size=$(du -h "$log_file" | cut -f1)
                echo "$container: $log_size"
            fi
        fi
    done
    
    echo ""
    
    # 清理容器日志
    echo "清理容器日志..."
    for container in "${containers[@]}"; do
        if docker ps --format "{{.Names}}" | grep -q "^${container}$"; then
            execute_command "docker logs --tail 1000 $container > /tmp/${container}_recent.log 2>&1 && echo '' > \$(docker inspect --format='{{.LogPath}}' $container)" "清理 $container 日志"
        fi
    done
    
    # 设置日志轮转（如果尚未配置）
    if [ "$DRY_RUN" != true ]; then
        if [ ! -f "/etc/docker/daemon.json" ] || ! grep -q "log-driver" /etc/docker/daemon.json 2>/dev/null; then
            echo ""
            echo -e "${YELLOW}建议配置 Docker 日志轮转:${NC}"
            echo "sudo mkdir -p /etc/docker"
            echo 'echo "{"log-driver":"json-file","log-opts":{"max-size":"10m","max-file":"3"}}" | sudo tee /etc/docker/daemon.json'
            echo "sudo systemctl reload docker"
        fi
    fi
    
    echo ""
    echo -e "${GREEN}✅ 日志管理完成${NC}"
}

# 系统更新
update_system() {
    echo -e "${BLUE}🔄 开始系统更新...${NC}"
    echo ""
    
    # 更新系统包
    echo "更新系统软件包..."
    execute_command "sudo apt update && sudo apt upgrade -y" "更新系统软件包"
    
    # 更新 Docker 镜像
    echo ""
    echo "更新 Docker 镜像..."
    execute_command "docker compose -f docker-compose.prod.yml pull" "拉取最新的 Docker 镜像"
    
    # 重新构建应用镜像
    echo ""
    echo "重新构建应用..."
    execute_command "git pull origin main" "拉取最新代码"
    execute_command "docker compose -f docker-compose.prod.yml build --no-cache app" "重新构建应用镜像"
    
    # 重启服务
    echo ""
    echo "重启服务..."
    execute_command "docker compose -f docker-compose.prod.yml up -d" "重启所有服务"
    
    echo ""
    echo -e "${GREEN}✅ 系统更新完成${NC}"
}

# 实时监控
monitor_system() {
    echo -e "${BLUE}📊 实时系统监控${NC}"
    echo ""
    echo "按 Ctrl+C 退出监控"
    echo ""
    
    while true; do
        clear
        echo -e "${BLUE}班主任班级管理平台 - 实时监控 ($(date))${NC}"
        echo "============================================="
        
        # 容器状态
        echo ""
        echo -e "${YELLOW}容器状态:${NC}"
        docker compose -f docker-compose.prod.yml ps --format "table {{.Service}}\t{{.State}}\t{{.Status}}"
        
        # 系统资源
        echo ""
        echo -e "${YELLOW}系统资源:${NC}"
        echo -n "CPU: "
        top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1
        echo -n "内存: "
        free -h | grep '^Mem:' | awk '{printf "%s / %s (%.1f%%)\n", $3, $2, ($3/$2)*100}'
        echo -n "磁盘: "
        df -h / | tail -1 | awk '{print $5 " used"}'
        
        # 网络连接
        echo ""
        echo -e "${YELLOW}网络连接:${NC}"
        ss -tlun | grep -E ':(80|443|5432) ' | while read line; do
            port=$(echo $line | awk '{print $5}' | cut -d: -f2)
            echo "端口 $port: 活跃"
        done
        
        # 最近日志
        echo ""
        echo -e "${YELLOW}最近日志 (最新5条):${NC}"
        docker compose -f docker-compose.prod.yml logs --tail 5 --no-log-prefix 2>/dev/null | tail -5
        
        sleep 5
    done
}

# 主函数
main() {
    echo -e "${BLUE}班主任班级管理平台 - 系统维护工具${NC}"
    echo ""
    
    case $ACTION in
        cleanup)
            cleanup_system
        ;;
        optimize)
            optimize_database
        ;;
        logs)
            manage_logs
        ;;
        update)
            update_system
        ;;
        monitor)
            monitor_system
        ;;
        *)
            echo -e "${RED}❌ 未知操作: $ACTION${NC}"
            show_usage
            exit 1
        ;;
    esac
}

# 脚本入口
parse_args "$@"
main