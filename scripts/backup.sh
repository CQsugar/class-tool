#!/bin/bash

# ==============================================
# 数据库备份脚本
# ==============================================

set -e

BACKUP_DIR="./backups"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}
POSTGRES_CONTAINER="class-tool-postgres-prod"

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 生成备份文件名
BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"

echo "🔄 开始备份数据库..."

# 执行备份
if docker ps | grep -q "$POSTGRES_CONTAINER"; then
    docker exec "$POSTGRES_CONTAINER" pg_dump -U postgres class_tool > "$BACKUP_FILE"
    
    # 压缩备份文件
    gzip "$BACKUP_FILE"
    
    echo "✅ 备份完成: ${BACKUP_FILE}.gz"
    
    # 清理旧备份
    echo "🧹 清理 ${RETENTION_DAYS} 天前的备份文件..."
    find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
    
    echo "✅ 清理完成"
else
    echo "❌ 数据库容器未运行"
    exit 1
fi
