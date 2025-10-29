#!/bin/bash

# ==============================================
# 班主任班级管理平台 - 数据库备份脚本
# 支持自动压缩、清理和通知功能
# ==============================================

set -e

# 配置参数
BACKUP_DIR="./backups"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}
POSTGRES_CONTAINER="class-tool-postgres-prod"
POSTGRES_USER="postgres"
POSTGRES_DB="class_tool"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 显示使用说明
show_usage() {
    echo "数据库备份脚本"
    echo ""
    echo "使用方法:"
    echo "  $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help          显示此帮助信息"
    echo "  -r, --retention N   设置备份保留天数（默认: 30天）"
    echo "  --no-compress       不压缩备份文件"
    echo "  --no-cleanup        不清理旧备份"
    echo ""
    echo "示例:"
    echo "  $0                  # 标准备份"
    echo "  $0 -r 7             # 备份并保留7天"
    echo "  $0 --no-compress    # 不压缩的备份"
    echo ""
}

# 解析命令行参数
parse_args() {
    COMPRESS=true
    CLEANUP=true
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
            ;;
            -r|--retention)
                RETENTION_DAYS="$2"
                shift 2
            ;;
            --no-compress)
                COMPRESS=false
                shift
            ;;
            --no-cleanup)
                CLEANUP=false
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

# 检查容器状态
check_container() {
    if ! docker ps | grep -q "$POSTGRES_CONTAINER"; then
        echo -e "${RED}❌ 错误: 数据库容器 '$POSTGRES_CONTAINER' 未运行${NC}"
        echo "请先启动数据库服务: docker compose -f docker-compose.prod.yml up -d postgres"
        exit 1
    fi
    
    # 检查数据库连接
    if ! docker exec "$POSTGRES_CONTAINER" pg_isready -U "$POSTGRES_USER" >/dev/null 2>&1; then
        echo -e "${RED}❌ 错误: 数据库未就绪${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ 数据库容器运行正常${NC}"
}

# 创建备份目录
prepare_backup_dir() {
    mkdir -p "$BACKUP_DIR"
    
    # 检查磁盘空间
    available_space=$(df "$BACKUP_DIR" | tail -1 | awk '{print $4}')
    if [ "$available_space" -lt 1048576 ]; then  # 小于1GB
        echo -e "${YELLOW}⚠️  警告: 备份目录可用空间不足1GB${NC}"
    fi
}

# 执行数据库备份
perform_backup() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/backup_${timestamp}.sql"
    local final_file="$backup_file"
    
    echo -e "${BLUE}🔄 开始备份数据库...${NC}"
    echo "数据库: $POSTGRES_DB"
    echo "时间戳: $timestamp"
    
    # 执行 pg_dump
    if docker exec "$POSTGRES_CONTAINER" pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --verbose > "$backup_file" 2>/dev/null; then
        
        # 压缩备份文件
        if [ "$COMPRESS" = true ]; then
            echo "压缩备份文件..."
            gzip "$backup_file"
            final_file="${backup_file}.gz"
        fi
        
        # 计算文件大小
        local file_size=$(du -h "$final_file" | cut -f1)
        
        echo -e "${GREEN}✅ 备份完成${NC}"
        echo "备份文件: $final_file"
        echo "文件大小: $file_size"
        
        # 验证备份文件
        if [ "$COMPRESS" = true ]; then
            if ! gzip -t "$final_file" 2>/dev/null; then
                echo -e "${RED}❌ 备份文件损坏！${NC}"
                exit 1
            fi
        else
            if [ ! -s "$final_file" ]; then
                echo -e "${RED}❌ 备份文件为空！${NC}"
                exit 1
            fi
        fi
        
        echo -e "${GREEN}✅ 备份文件验证通过${NC}"
        
    else
        echo -e "${RED}❌ 备份失败${NC}"
        exit 1
    fi
}

# 清理旧备份
cleanup_old_backups() {
    if [ "$CLEANUP" != true ]; then
        echo -e "${YELLOW}⚠️  跳过备份清理${NC}"
        return 0
    fi
    
    echo -e "${BLUE}🧹 清理 ${RETENTION_DAYS} 天前的备份文件...${NC}"
    
    # 查找并删除旧文件
    local deleted_count=0
    
    # 清理压缩备份
    while IFS= read -r -d '' file; do
        rm "$file"
        echo "删除: $(basename "$file")"
        ((deleted_count++))
    done < <(find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -print0 2>/dev/null)
    
    # 清理未压缩备份
    while IFS= read -r -d '' file; do
        rm "$file"
        echo "删除: $(basename "$file")"
        ((deleted_count++))
    done < <(find "$BACKUP_DIR" -name "backup_*.sql" -mtime +$RETENTION_DAYS -print0 2>/dev/null)
    
    if [ $deleted_count -gt 0 ]; then
        echo -e "${GREEN}✅ 清理完成，删除了 $deleted_count 个过期备份${NC}"
    else
        echo -e "${BLUE}ℹ️  没有需要清理的过期备份${NC}"
    fi
}

# 显示备份统计
show_backup_stats() {
    echo ""
    echo "📊 备份统计:"
    
    local total_backups=$(find "$BACKUP_DIR" -name "backup_*.sql*" 2>/dev/null | wc -l)
    local total_size=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
    
    echo "  总备份数: $total_backups"
    echo "  总占用空间: $total_size"
    echo "  保留策略: ${RETENTION_DAYS} 天"
    
    echo ""
    echo "📁 最近的备份文件:"
    find "$BACKUP_DIR" -name "backup_*.sql*" -printf "%T@ %Tc %p\n" 2>/dev/null | sort -nr | head -5 | while read timestamp datetime filepath; do
        size=$(du -h "$filepath" 2>/dev/null | cut -f1)
        echo "  $(basename "$filepath") ($size) - $datetime"
    done
}

# 主函数
main() {
    echo -e "${BLUE}班主任班级管理平台 - 数据库备份工具${NC}"
    echo ""
    
    check_container
    prepare_backup_dir
    perform_backup
    cleanup_old_backups
    show_backup_stats
    
    echo ""
    echo -e "${GREEN}🎉 备份任务完成！${NC}"
}

# 脚本入口
parse_args "$@"
main
