#!/bin/bash

# ==============================================
# 数据库恢复脚本
# ==============================================

set -e

POSTGRES_CONTAINER="class-tool-postgres-prod"

if [ -z "$1" ]; then
    echo "用法: ./restore.sh <备份文件路径>"
    echo "示例: ./restore.sh ./backups/backup_20250128_120000.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ 备份文件不存在: $BACKUP_FILE"
    exit 1
fi

echo "⚠️  警告: 此操作将覆盖现有数据库！"
read -p "确认要恢复数据库吗？(yes/no) " -r
echo

if [[ ! $REPLY =~ ^yes$ ]]; then
    echo "已取消恢复操作"
    exit 0
fi

echo "🔄 开始恢复数据库..."

# 解压文件（如果是压缩文件）
if [[ $BACKUP_FILE == *.gz ]]; then
    echo "解压备份文件..."
    gunzip -c "$BACKUP_FILE" | docker exec -i "$POSTGRES_CONTAINER" psql -U postgres class_tool
else
    cat "$BACKUP_FILE" | docker exec -i "$POSTGRES_CONTAINER" psql -U postgres class_tool
fi

echo "✅ 数据库恢复完成"
