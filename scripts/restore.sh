#!/bin/bash

# ==============================================
# 班主任班级管理平台 - 数据库恢复脚本
# 支持备份验证、安全确认和回滚功能
# ==============================================

set -e

# 配置参数
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
    echo "数据库恢复脚本"
    echo ""
    echo "使用方法:"
    echo "  $0 <备份文件路径> [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help          显示此帮助信息"
    echo "  --no-backup         不创建恢复前备份"
    echo "  --force             跳过安全确认"
    echo ""
    echo "示例:"
    echo "  $0 ./backups/backup_20250128_120000.sql.gz"
    echo "  $0 ./backup.sql --no-backup"
    echo "  $0 ./backup.sql.gz --force"
    echo ""
    echo "支持的文件格式:"
    echo "  - .sql     未压缩的 SQL 文件"
    echo "  - .sql.gz  gzip 压缩的 SQL 文件"
    echo ""
}

# 解析命令行参数
parse_args() {
    BACKUP_FILE=""
    CREATE_BACKUP=true
    FORCE_RESTORE=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
            ;;
            --no-backup)
                CREATE_BACKUP=false
                shift
            ;;
            --force)
                FORCE_RESTORE=true
                shift
            ;;
            -*)
                echo -e "${RED}❌ 未知选项: $1${NC}"
                show_usage
                exit 1
            ;;
            *)
                if [ -z "$BACKUP_FILE" ]; then
                    BACKUP_FILE="$1"
                else
                    echo -e "${RED}❌ 只能指定一个备份文件${NC}"
                    show_usage
                    exit 1
                fi
                shift
            ;;
        esac
    done
    
    if [ -z "$BACKUP_FILE" ]; then
        echo -e "${RED}❌ 错误: 请指定备份文件路径${NC}"
        show_usage
        exit 1
    fi
}

# 检查备份文件
validate_backup_file() {
    if [ ! -f "$BACKUP_FILE" ]; then
        echo -e "${RED}❌ 备份文件不存在: $BACKUP_FILE${NC}"
        exit 1
    fi
    
    # 检查文件格式和完整性
    case "$BACKUP_FILE" in
        *.sql.gz)
            echo "检查压缩备份文件完整性..."
            if ! gzip -t "$BACKUP_FILE" 2>/dev/null; then
                echo -e "${RED}❌ 备份文件损坏或不是有效的 gzip 文件${NC}"
                exit 1
            fi
        ;;
        *.sql)
            if [ ! -s "$BACKUP_FILE" ]; then
                echo -e "${RED}❌ 备份文件为空${NC}"
                exit 1
            fi
        ;;
        *)
            echo -e "${RED}❌ 不支持的文件格式: $BACKUP_FILE${NC}"
            echo "支持的格式: .sql, .sql.gz"
            exit 1
        ;;
    esac
    
    # 显示文件信息
    local file_size=$(du -h "$BACKUP_FILE" | cut -f1)
    local file_date=$(stat -c %y "$BACKUP_FILE" | cut -d' ' -f1,2)
    
    echo -e "${GREEN}✅ 备份文件验证通过${NC}"
    echo "文件路径: $BACKUP_FILE"
    echo "文件大小: $file_size"
    echo "修改时间: $file_date"
}

# 检查数据库容器
check_database() {
    if ! docker ps | grep -q "$POSTGRES_CONTAINER"; then
        echo -e "${RED}❌ 错误: 数据库容器 '$POSTGRES_CONTAINER' 未运行${NC}"
        echo "请先启动数据库服务: docker compose -f docker-compose.prod.yml up -d postgres"
        exit 1
    fi
    
    if ! docker exec "$POSTGRES_CONTAINER" pg_isready -U "$POSTGRES_USER" >/dev/null 2>&1; then
        echo -e "${RED}❌ 错误: 数据库未就绪${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ 数据库容器运行正常${NC}"
}

# 显示当前数据库状态
show_database_info() {
    echo -e "${BLUE}📊 当前数据库信息:${NC}"
    
    # 获取数据库大小
    local db_size=$(docker exec "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT pg_size_pretty(pg_database_size('$POSTGRES_DB'));" 2>/dev/null | tr -d ' \n' || echo "未知")
    
    # 获取表数量
    local table_count=$(docker exec "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' \n' || echo "0")
    
    # 获取用户数量
    local user_count=$(docker exec "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT COUNT(*) FROM \"User\";" 2>/dev/null | tr -d ' \n' || echo "0")
    
    echo "数据库大小: $db_size"
    echo "数据表数量: $table_count"
    echo "用户数量: $user_count"
}

# 创建恢复前备份
create_pre_restore_backup() {
    if [ "$CREATE_BACKUP" != true ]; then
        echo -e "${YELLOW}⚠️  跳过恢复前备份${NC}"
        return 0
    fi
    
    echo -e "${BLUE}💾 创建恢复前备份...${NC}"
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local pre_backup_file="./backups/pre_restore_backup_${timestamp}.sql.gz"
    
    mkdir -p ./backups
    
    if docker exec "$POSTGRES_CONTAINER" pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" | gzip > "$pre_backup_file"; then
        echo -e "${GREEN}✅ 恢复前备份已创建: $pre_backup_file${NC}"
        echo -e "${YELLOW}⚠️  如果恢复失败，可使用此备份回滚${NC}"
        PRE_RESTORE_BACKUP="$pre_backup_file"
    else
        echo -e "${RED}❌ 恢复前备份失败${NC}"
        exit 1
    fi
}

# 确认恢复操作
confirm_restore() {
    if [ "$FORCE_RESTORE" = true ]; then
        echo -e "${YELLOW}⚠️  强制模式: 跳过确认${NC}"
        return 0
    fi
    
    echo ""
    echo -e "${RED}⚠️  危险操作警告！${NC}"
    echo "此操作将完全替换当前数据库的所有数据！"
    echo "所有现有数据将被永久删除！"
    echo ""
    echo "备份文件: $BACKUP_FILE"
    echo ""
    
    read -p "确认要恢复数据库吗？请输入 'yes' 确认: " -r
    echo
    
    if [[ ! $REPLY =~ ^yes$ ]]; then
        echo "已取消恢复操作"
        exit 0
    fi
    
    echo -e "${YELLOW}最后确认: 请再次输入 'RESTORE' 以继续:${NC}"
    read -p "> " -r
    
    if [[ ! $REPLY =~ ^RESTORE$ ]]; then
        echo "已取消恢复操作"
        exit 0
    fi
}

# 执行数据库恢复
perform_restore() {
    echo -e "${BLUE}🔄 开始恢复数据库...${NC}"
    
    # 先删除现有数据库内容（保留结构）
    echo "清理现有数据..."
    docker exec "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "
        DO \$\$
        DECLARE
            r RECORD;
        BEGIN
            -- 禁用外键约束
            FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
                EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' RESTART IDENTITY CASCADE';
            END LOOP;
        END
        \$\$;
    " 2>/dev/null || {
        echo -e "${YELLOW}⚠️  清理数据时出现警告，继续恢复...${NC}"
    }
    
    # 恢复数据
    echo "恢复备份数据..."
    if [[ $BACKUP_FILE == *.gz ]]; then
        # 处理压缩文件
        if gunzip -c "$BACKUP_FILE" | docker exec -i "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ 压缩备份恢复成功${NC}"
        else
            echo -e "${RED}❌ 压缩备份恢复失败${NC}"
            rollback_restore
            exit 1
        fi
    else
        # 处理普通 SQL 文件
        if cat "$BACKUP_FILE" | docker exec -i "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ SQL 备份恢复成功${NC}"
        else
            echo -e "${RED}❌ SQL 备份恢复失败${NC}"
            rollback_restore
            exit 1
        fi
    fi
}

# 回滚恢复（如果有恢复前备份）
rollback_restore() {
    if [ -n "$PRE_RESTORE_BACKUP" ] && [ -f "$PRE_RESTORE_BACKUP" ]; then
        echo -e "${YELLOW}🔄 尝试回滚到恢复前状态...${NC}"
        if gunzip -c "$PRE_RESTORE_BACKUP" | docker exec -i "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ 成功回滚到恢复前状态${NC}"
        else
            echo -e "${RED}❌ 回滚失败，请手动恢复${NC}"
        fi
    fi
}

# 验证恢复结果
verify_restore() {
    echo -e "${BLUE}🔍 验证恢复结果...${NC}"
    
    # 检查数据库连接
    if ! docker exec "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT 1;" >/dev/null 2>&1; then
        echo -e "${RED}❌ 数据库连接失败${NC}"
        rollback_restore
        exit 1
    fi
    
    # 检查基本表是否存在
    local table_count=$(docker exec "$POSTGRES_CONTAINER" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' \n' || echo "0")
    
    if [ "$table_count" -eq 0 ]; then
        echo -e "${RED}❌ 恢复后数据库中没有表${NC}"
        rollback_restore
        exit 1
    fi
    
    echo -e "${GREEN}✅ 数据库恢复验证通过${NC}"
    echo "恢复后表数量: $table_count"
}

# 显示恢复完成信息
show_restore_summary() {
    echo ""
    echo -e "${GREEN}🎉 数据库恢复完成！${NC}"
    echo ""
    
    # 显示恢复后的数据库信息
    show_database_info
    
    echo ""
    echo "📝 重要提醒:"
    echo "1. 恢复完成后，建议重启应用服务"
    echo "2. 验证应用功能是否正常"
    echo "3. 如有问题，可使用恢复前备份回滚"
    
    if [ -n "$PRE_RESTORE_BACKUP" ]; then
        echo ""
        echo "🔄 回滚命令（如需要）:"
        echo "  $0 \"$PRE_RESTORE_BACKUP\" --no-backup"
    fi
    
    echo ""
    echo "🔄 重启应用服务:"
    echo "  docker compose -f docker-compose.prod.yml restart app"
}

# 主函数
main() {
    echo -e "${BLUE}班主任班级管理平台 - 数据库恢复工具${NC}"
    echo ""
    
    validate_backup_file
    check_database
    show_database_info
    confirm_restore
    create_pre_restore_backup
    perform_restore
    verify_restore
    show_restore_summary
}

# 脚本入口
parse_args "$@"
main
