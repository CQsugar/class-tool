#!/bin/bash

# ==============================================
# 直接传输 Docker 镜像到远程服务器部署脚本
# 无需 Docker Registry，通过 SSH 直接传输
# ==============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 开始直接传输部署流程...${NC}"

# SSH 连接辅助函数
get_ssh_cmd() {
    if [[ -n "$SSH_TARGET" && "$SSH_TARGET" != *"@"* ]]; then
        # SSH config 名称
        echo "ssh $SSH_TARGET"
    else
        # 传统格式: user@host
        local target="${REMOTE_USER:+$REMOTE_USER@}$REMOTE_HOST"
        local cmd="ssh"
        [[ "$REMOTE_PORT" != "22" ]] && cmd="$cmd -p $REMOTE_PORT"
        echo "$cmd $target"
    fi
}

# SCP 传输辅助函数
get_scp_cmd() {
    local local_file="$1"
    local remote_path="$2"
    
    if [[ -n "$SSH_TARGET" && "$SSH_TARGET" != *"@"* ]]; then
        # SSH config 名称
        echo "scp $local_file $SSH_TARGET:$remote_path"
    else
        # 传统格式: user@host
        local target="${REMOTE_USER:+$REMOTE_USER@}$REMOTE_HOST"
        local cmd="scp"
        [[ "$REMOTE_PORT" != "22" ]] && cmd="$cmd -P $REMOTE_PORT"
        echo "$cmd $local_file $target:$remote_path"
    fi
}

# 配置变量 - 请根据实际情况修改
REMOTE_HOST="${REMOTE_HOST:-your-server.com}"     # 远程服务器地址
REMOTE_USER="${REMOTE_USER:-root}"                # 远程服务器用户
REMOTE_PORT="${REMOTE_PORT:-22}"                  # SSH 端口
SSH_TARGET="${SSH_TARGET:-}"                      # SSH 目标 (格式: user@host 或 ssh-config-name)
IMAGE_NAME="${IMAGE_NAME:-class-tool}"            # 镜像名称
IMAGE_TAG="${IMAGE_TAG:-latest}"                  # 镜像标签
REMOTE_PROJECT_DIR="${REMOTE_PROJECT_DIR:-/opt/class-tool}"  # 远程项目目录

# 显示使用说明
show_usage() {
    echo "直接传输部署脚本 - 无需 Docker Registry"
    echo ""
    echo "使用方法:"
    echo "  $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help              显示此帮助信息"
    echo "  --host <hostname>       远程服务器地址 (默认: $REMOTE_HOST)"
    echo "  --user <username>       远程服务器用户 (默认: $REMOTE_USER)"
    echo "  --port <port>           SSH 端口 (默认: $REMOTE_PORT)"
    echo "  --ssh-target <target>   SSH 目标 (user@host 或 SSH config 名称)"
    echo "  --project-dir <path>    远程项目目录 (默认: $REMOTE_PROJECT_DIR)"
    echo "  --image-name <name>     镜像名称 (默认: $IMAGE_NAME)"
    echo "  --image-tag <tag>       镜像标签 (默认: $IMAGE_TAG)"
    echo ""
    echo "环境变量:"
    echo "  REMOTE_HOST             远程服务器地址"
    echo "  REMOTE_USER             远程服务器用户"
    echo "  REMOTE_PORT             SSH 端口"
    echo "  SSH_TARGET              SSH 目标"
    echo "  REMOTE_PROJECT_DIR      远程项目目录"
    echo "  IMAGE_NAME              镜像名称"
    echo "  IMAGE_TAG               镜像标签"
    echo ""
    echo "示例:"
    echo "  # 使用传统参数"
    echo "  $0 --host 192.168.1.100 --user ubuntu"
    echo "  $0 --host myserver.com --port 2222"
    echo ""
    echo "  # 使用 SSH Config"
    echo "  $0 --ssh-target myserver"
    echo "  $0 --ssh-target user@192.168.1.100"
    echo ""
}

# 解析命令行参数
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
            ;;
            --host)
                REMOTE_HOST="$2"
                shift 2
            ;;
            --user)
                REMOTE_USER="$2"
                shift 2
            ;;
            --port)
                REMOTE_PORT="$2"
                shift 2
            ;;
            --project-dir)
                REMOTE_PROJECT_DIR="$2"
                shift 2
            ;;
            --image-name)
                IMAGE_NAME="$2"
                shift 2
            ;;
            --image-tag)
                IMAGE_TAG="$2"
                shift 2
            ;;
            --ssh-target)
                SSH_TARGET="$2"
                shift 2
            ;;
            *)
                echo -e "${RED}❌ 未知选项: $1${NC}"
                show_usage
                exit 1
            ;;
        esac
    done
    
    # 设置 SSH 目标
    if [[ -n "$SSH_TARGET" ]]; then
        # 如果指定了 SSH_TARGET，使用它覆盖其他设置
        if [[ "$SSH_TARGET" == *"@"* ]]; then
            # 格式: user@host，解析用户名和主机名
            REMOTE_USER="${SSH_TARGET%@*}"
            REMOTE_HOST="${SSH_TARGET#*@}"
        else
            # SSH config 名称，直接使用
            REMOTE_HOST="$SSH_TARGET"
            REMOTE_USER=""  # SSH config 中配置
        fi
    fi
}

# 检查必要的工具
check_requirements() {
    echo -e "${BLUE}📋 检查必要工具...${NC}"
    
    # 检查 Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ 错误: Docker 未安装${NC}"
        exit 1
    fi
    
    # 检查 SSH
    if ! command -v ssh &> /dev/null; then
        echo -e "${RED}❌ 错误: SSH 客户端未安装${NC}"
        exit 1
    fi
    
    # 检查 scp
    if ! command -v scp &> /dev/null; then
        echo -e "${RED}❌ 错误: SCP 未安装${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ 工具检查完成${NC}"
}

# 测试 SSH 连接
test_ssh_connection() {
    echo -e "${BLUE}🔐 测试 SSH 连接...${NC}"
    
    # 构建 SSH 连接字符串
    local ssh_cmd
    if [[ -n "$SSH_TARGET" && "$SSH_TARGET" != *"@"* ]]; then
        # SSH config 名称
        ssh_cmd="ssh -o ConnectTimeout=10 $SSH_TARGET"
    else
        # 传统格式: user@host
        local target="${REMOTE_USER:+$REMOTE_USER@}$REMOTE_HOST"
        ssh_cmd="ssh -o ConnectTimeout=10"
        [[ "$REMOTE_PORT" != "22" ]] && ssh_cmd="$ssh_cmd -p $REMOTE_PORT"
        ssh_cmd="$ssh_cmd $target"
    fi
    
    if $ssh_cmd "echo 'SSH 连接成功'" 2>/dev/null; then
        echo -e "${GREEN}✅ SSH 连接正常${NC}"
    else
        echo -e "${RED}❌ SSH 连接失败${NC}"
        echo -e "${YELLOW}💡 请检查:${NC}"
        if [[ -n "$SSH_TARGET" && "$SSH_TARGET" != *"@"* ]]; then
            echo "   1. SSH config 名称: $SSH_TARGET"
            echo "   2. SSH 配置文件: ~/.ssh/config"
        else
            echo "   1. 服务器地址: $REMOTE_HOST"
            echo "   2. 用户名: $REMOTE_USER"
            echo "   3. SSH 端口: $REMOTE_PORT"
        fi
        echo "   4. SSH 密钥配置"
        exit 1
    fi
}

# 构建 Docker 镜像
build_image() {
    echo -e "${BLUE}🔨 构建 Docker 镜像...${NC}"
    
    # 检查 .env.production 文件
    if [ ! -f ".env.production" ]; then
        echo -e "${RED}❌ 错误: .env.production 文件不存在${NC}"
        echo -e "${YELLOW}💡 提示: 请先配置环境变量${NC}"
        echo "cp .env.production.example .env.production"
        echo "nano .env.production"
        exit 1
    fi
    
    # 构建镜像
    docker build -t "$IMAGE_NAME:$IMAGE_TAG" . || {
        echo -e "${RED}❌ Docker 镜像构建失败${NC}"
        exit 1
    }
    
    echo -e "${GREEN}✅ Docker 镜像构建完成: $IMAGE_NAME:$IMAGE_TAG${NC}"
}

# 导出镜像为 tar 文件
export_image() {
    echo -e "${BLUE}📦 导出 Docker 镜像...${NC}" >&2
    
    local tar_file="${IMAGE_NAME}_${IMAGE_TAG}.tar"
    
    # 导出镜像
    docker save -o "$tar_file" "$IMAGE_NAME:$IMAGE_TAG" || {
        echo -e "${RED}❌ 镜像导出失败${NC}" >&2
        exit 1
    }
    
    # 压缩镜像文件
    echo -e "${BLUE}🗜️  压缩镜像文件...${NC}" >&2
    gzip "$tar_file" || {
        echo -e "${RED}❌ 镜像压缩失败${NC}" >&2
        exit 1
    }
    
    local compressed_file="${tar_file}.gz"
    local file_size=$(du -sh "$compressed_file" | cut -f1)
    
    echo -e "${GREEN}✅ 镜像导出完成: $compressed_file (大小: $file_size)${NC}" >&2
    echo "$compressed_file"
}

# 传输文件到远程服务器
transfer_files() {
    local compressed_file="$1"
    
    echo -e "${BLUE}🚚 传输文件到远程服务器...${NC}"
    
    # 创建远程目录并设置正确的权限
    $(get_ssh_cmd) "sudo mkdir -p '$REMOTE_PROJECT_DIR' && sudo chown \$(whoami):\$(whoami) '$REMOTE_PROJECT_DIR'" || {
        echo -e "${RED}❌ 远程目录创建失败${NC}"
        exit 1
    }
    
    # 传输压缩的镜像文件
    echo "传输镜像文件..."
    $(get_scp_cmd "$compressed_file" "$REMOTE_PROJECT_DIR/") || {
        echo -e "${RED}❌ 镜像文件传输失败${NC}"
        exit 1
    }
    
    # 传输必要的配置文件
    echo "传输配置文件..."
    $(get_scp_cmd "docker-compose.prod.yml" "$REMOTE_PROJECT_DIR/") || {
        echo -e "${RED}❌ docker-compose.prod.yml 传输失败${NC}"
        exit 1
    }
    
    $(get_scp_cmd "traefik.toml" "$REMOTE_PROJECT_DIR/") || {
        echo -e "${RED}❌ traefik.toml 传输失败${NC}"
        exit 1
    }
    
    # 传输管理脚本（可选但有用）
    echo "传输管理脚本..."
    $(get_scp_cmd "scripts/backup.sh" "$REMOTE_PROJECT_DIR/scripts/") || echo -e "${YELLOW}⚠️  backup.sh 传输失败，跳过${NC}"
    $(get_scp_cmd "scripts/restore.sh" "$REMOTE_PROJECT_DIR/scripts/") || echo -e "${YELLOW}⚠️  restore.sh 传输失败，跳过${NC}"
    $(get_scp_cmd "scripts/maintenance.sh" "$REMOTE_PROJECT_DIR/scripts/") || echo -e "${YELLOW}⚠️  maintenance.sh 传输失败，跳过${NC}"
    $(get_scp_cmd "scripts/status.sh" "$REMOTE_PROJECT_DIR/scripts/") || echo -e "${YELLOW}⚠️  status.sh 传输失败，跳过${NC}"
    $(get_scp_cmd "scripts/check-env.sh" "$REMOTE_PROJECT_DIR/scripts/") || echo -e "${YELLOW}⚠️  check-env.sh 传输失败，跳过${NC}"
    
    # 创建 backups 目录
    $(get_ssh_cmd) "mkdir -p '$REMOTE_PROJECT_DIR/backups'" || echo -e "${YELLOW}⚠️  创建 backups 目录失败${NC}"
    
    # 传输环境配置文件
    if [ -f ".env.production" ]; then
        echo "传输生产环境配置..."
        $(get_scp_cmd ".env.production" "$REMOTE_PROJECT_DIR/") || {
            echo -e "${RED}❌ .env.production 传输失败${NC}"
            exit 1
        }
    else
        echo "传输环境配置模板..."
        $(get_scp_cmd ".env.production.image.example" "$REMOTE_PROJECT_DIR/") || {
            echo -e "${RED}❌ .env.production.image.example 传输失败${NC}"
            exit 1
        }
    fi
    
    # 传输成功后立即删除本地压缩文件
    echo "🗑️  删除本地镜像文件..."
    rm -f "$compressed_file" || echo -e "${YELLOW}⚠️  删除本地文件失败: $compressed_file${NC}"
    
    echo -e "${GREEN}✅ 文件传输完成${NC}"
}

# 在远程服务器上部署
deploy_remote() {
    local compressed_file="$1"
    local tar_file="${compressed_file%.gz}"
    
    echo -e "${BLUE}🎯 在远程服务器上部署...${NC}"
    
    # 构建远程执行脚本
    cat > /tmp/remote_deploy.sh << EOF
#!/bin/bash
set -e

cd '$REMOTE_PROJECT_DIR'

echo "🗜️  解压镜像文件..."
gunzip -f '$compressed_file'

echo "📥 加载 Docker 镜像..."
docker load -i '$tar_file'

echo "🗑️  清理镜像文件..."
rm -f '$tar_file'

echo "📝 检查环境配置..."
if [ ! -f ".env.production" ]; then
    if [ -f ".env.production.image.example" ]; then
        cp .env.production.image.example .env.production
        echo "⚠️  已从模板创建 .env.production 文件"
        echo "   请编辑配置: nano .env.production"
    else
        echo "❌ 错误: 没有找到环境配置文件"
        exit 1
    fi
else
    echo "✅ 环境配置文件已存在"
fi

echo "🔗 创建 Docker Compose 环境文件..."
# Docker Compose 默认读取 .env 文件，所以复制 .env.production 到 .env
cp .env.production .env
echo "✅ 已创建 .env 文件供 Docker Compose 使用"

echo "🔧 设置脚本权限..."
# 为管理脚本添加执行权限
if [ -d "scripts" ]; then
    chmod +x scripts/*.sh 2>/dev/null || true
    echo "✅ 脚本权限已设置"
fi

echo "🔄 停止现有服务..."
docker compose -f docker-compose.prod.yml down || true

echo "🚀 启动服务..."
docker compose -f docker-compose.prod.yml up -d

echo "✅ 部署完成！"
docker compose -f docker-compose.prod.yml ps
EOF
    
    # 传输并执行部署脚本
    $(get_scp_cmd "/tmp/remote_deploy.sh" "$REMOTE_PROJECT_DIR/") || {
        echo -e "${RED}❌ 部署脚本传输失败${NC}"
        exit 1
    }
    
    $(get_ssh_cmd) "chmod +x '$REMOTE_PROJECT_DIR/remote_deploy.sh' && '$REMOTE_PROJECT_DIR/remote_deploy.sh'" || {
        echo -e "${RED}❌ 远程部署执行失败${NC}"
        exit 1
    }
    
    # 清理本地文件
    rm -f /tmp/remote_deploy.sh
    
    echo -e "${GREEN}✅ 远程部署完成${NC}"
}

# 清理本地文件
cleanup() {
    echo -e "${BLUE}🧹 清理临时文件...${NC}"
    
    # 删除可能遗留的临时文件
    rm -f /tmp/remote_deploy.sh
    rm -f "${IMAGE_NAME}_${IMAGE_TAG}.tar.gz" 2>/dev/null || true
    
    echo -e "${GREEN}✅ 清理完成${NC}"
}

# 显示部署信息
show_deployment_info() {
    echo ""
    echo "========================================="
    echo "🎉 部署完成！"
    echo "========================================="
    echo ""
    echo -e "${BLUE}📍 远程服务器信息:${NC}"
    if [[ -n "$SSH_TARGET" && "$SSH_TARGET" != *"@"* ]]; then
        echo "  SSH 配置: $SSH_TARGET"
    else
        echo "  地址: $REMOTE_HOST${REMOTE_PORT:+:$REMOTE_PORT}"
        echo "  用户: $REMOTE_USER"
    fi
    echo "  项目目录: $REMOTE_PROJECT_DIR"
    echo ""
    echo -e "${BLUE}🌐 访问地址:${NC}"
    echo "  请在远程服务器上配置 .env.production 文件"
    echo "  然后访问配置的域名"
    echo ""
    echo -e "${BLUE}📝 后续操作:${NC}"
    echo "  1. SSH 登录远程服务器:"
    if [[ -n "$SSH_TARGET" && "$SSH_TARGET" != *"@"* ]]; then
        echo "     ssh $SSH_TARGET"
    else
        echo "     ssh ${REMOTE_PORT:+-p $REMOTE_PORT} ${REMOTE_USER:+$REMOTE_USER@}$REMOTE_HOST"
    fi
    echo ""
    echo "  2. 编辑环境配置:"
    echo "     cd $REMOTE_PROJECT_DIR"
    echo "     nano .env.production"
    echo ""
    echo "  3. 重启服务以应用配置:"
    echo "     docker compose -f docker-compose.prod.yml restart"
    echo ""
    echo "  4. 查看服务状态:"
    echo "     docker compose -f docker-compose.prod.yml ps"
    echo "     docker compose -f docker-compose.prod.yml logs -f"
    echo ""
}

# 主函数
main() {
    echo -e "${BLUE}直接传输部署脚本 v1.0${NC}"
    echo "无需 Docker Registry，通过 SSH 直接传输镜像"
    echo ""
    
    # 显示配置信息
    echo -e "${BLUE}📋 当前配置:${NC}"
    if [[ -n "$SSH_TARGET" && "$SSH_TARGET" != *"@"* ]]; then
        echo "  SSH 配置: $SSH_TARGET"
    else
        echo "  远程服务器: ${REMOTE_USER:+$REMOTE_USER@}$REMOTE_HOST${REMOTE_PORT:+:$REMOTE_PORT}"
    fi
    echo "  项目目录: $REMOTE_PROJECT_DIR"
    echo "  镜像名称: $IMAGE_NAME:$IMAGE_TAG"
    echo ""
    
    # 执行部署流程
    check_requirements
    test_ssh_connection
    build_image
    
    local compressed_file
    compressed_file=$(export_image)
    
    transfer_files "$compressed_file"
    deploy_remote "$(basename "$compressed_file")"
    cleanup
    show_deployment_info
}

# 脚本入口
parse_args "$@"
main