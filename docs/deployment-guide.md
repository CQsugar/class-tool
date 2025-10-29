# 班主任班级管理平台 - 生产环境部署指南

本文档提供详细的生产环境部署步骤和最佳实践。项目已完全迁移到 Traefik 作为反向代理，提供自动 HTTPS 证书管理。

## 📋 目录

- [系统要求](#系统要求)
- [部署前准备](#部署前准备)
- [快速部署](#快速部署)
- [Traefik 配置详解](#traefik-配置详解)
- [环境配置](#环境配置)
- [数据库管理](#数据库管理)
- [监控和日志](#监控和日志)
- [维护和更新](#维护和更新)
- [常见问题](#常见问题)

## 🖥️ 系统要求

### 最低配置

- **CPU**: 2 核心
- **内存**: 4 GB RAM
- **存储**: 20 GB 可用空间
- **操作系统**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+

### 推荐配置（50+ 学生）

- **CPU**: 4 核心
- **内存**: 8 GB RAM
- **存储**: 50 GB SSD
- **操作系统**: Ubuntu 22.04 LTS

### 软件要求

- Docker 20.10+
- Docker Compose 2.0+
- Git 2.x

## 🔧 部署前准备

### 1. 安装 Docker

#### Ubuntu/Debian

```bash
# 更新包索引
sudo apt update

# 安装依赖
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# 添加 Docker GPG 密钥
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# 添加 Docker 仓库
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 安装 Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker

# 添加当前用户到 docker 组
sudo usermod -aG docker $USER
```

#### CentOS/RHEL

```bash
# 安装依赖
sudo yum install -y yum-utils

# 添加 Docker 仓库
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# 安装 Docker
sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker
```

### 2. 验证安装

```bash
docker --version
docker compose version
```

### 3. 克隆项目

```bash
# 克隆代码仓库
git clone <your-repository-url> class-tool
cd class-tool
```

## 🚀 快速部署

本项目使用 **Traefik** 作为反向代理，可自动从 Let's Encrypt 获取和续期 SSL 证书，无需手动配置 Nginx。

### 方法一: 使用一键部署脚本（推荐）

```bash
# 1. 克隆项目
git clone <your-repository-url> class-tool
cd class-tool

# 2. 配置环境变量
cp .env.production.example .env.production
nano .env.production

# 3. 执行一键部署
chmod +x deploy.sh
./deploy.sh
```

### 方法二: 手动部署

#### 1. 配置环境变量

```bash
# 复制环境变量模板
cp .env.production.example .env.production

# 编辑环境变量（必须修改！）
nano .env.production
```

**必须修改的配置项：**

```bash
# 应用域名（改为你的实际域名）
NEXT_PUBLIC_APP_URL=https://your-domain.com
BETTER_AUTH_URL=https://your-domain.com
DOMAIN=your-domain.com

# 数据库密码（强密码！）
POSTGRES_PASSWORD=YOUR_STRONG_PASSWORD_HERE_CHANGE_ME

# 认证密钥（使用 openssl rand -hex 32 生成）
BETTER_AUTH_SECRET=CHANGE_THIS_TO_A_STRONG_SECRET_KEY_MIN_32_CHARS_USE_OPENSSL_RAND_HEX_32

# 数据持久化目录（可选，默认 ./data）
DATA_DIR=./data

# 是否禁用注册（生产环境建议设为 true）
NEXT_PUBLIC_DISABLE_SIGNUP=true
```

**生成安全密钥：**

```bash
# 生成 Better Auth 密钥
openssl rand -hex 32

# 生成强数据库密码
openssl rand -base64 32
```

#### 2. 配置 Traefik

编辑 `traefik.toml` 文件，修改邮箱地址（用于 Let's Encrypt 通知）：

```bash
# 编辑 Traefik 配置
nano traefik.toml

# 修改邮箱地址
[certificatesResolvers.letsencrypt.acme]
  email = "your-email@example.com"  # 改为你的真实邮箱
```

#### 3. 创建数据目录

```bash
# 创建数据持久化目录
mkdir -p data/{postgres,uploads,letsencrypt}

# 设置 Let's Encrypt 证书存储文件权限
touch data/letsencrypt/acme.json
chmod 600 data/letsencrypt/acme.json
```

#### 4. 启动服务

```bash
# 构建和启动所有服务
docker compose -f docker-compose.prod.yml up -d

# 查看服务状态
docker compose -f docker-compose.prod.yml ps

# 查看启动日志
docker compose -f docker-compose.prod.yml logs -f
```

#### 5. 初始化数据库

```bash
# 等待数据库启动
sleep 10

# 运行数据库迁移
docker compose -f docker-compose.prod.yml exec app sh -c "pnpm db:push"

# 初始化种子数据（可选，仅首次部署）
docker compose -f docker-compose.prod.yml exec app sh -c "pnpm db:seed"
```

#### 6. 访问应用

- **应用地址**: https://your-domain.com
- **Traefik Dashboard**: https://traefik.your-domain.com (用户名/密码: admin/admin)

> ⚠️ **重要**: 生产环境务必修改 Traefik Dashboard 的认证密码！

生成新的 Dashboard 密码：

```bash
# 安装 htpasswd 工具
sudo apt install apache2-utils

# 生成新的认证字符串
echo $(htpasswd -nb admin your-new-password) | sed -e s/\\$/\\$\\$/g
```

然后更新 `docker-compose.prod.yml` 中 traefik 服务的 `basicauth.users` 标签。

#### 手动部署步骤：

```bash
# 1. 构建镜像
docker compose -f docker-compose.prod.yml build --no-cache

# 2. 启动服务
docker compose -f docker-compose.prod.yml up -d

# 3. 等待数据库就绪
sleep 15

# 4. 运行数据库迁移
docker compose -f docker-compose.prod.yml exec app sh -c "pnpm db:push"

# 5. 初始化种子数据（可选，仅首次部署）
docker compose -f docker-compose.prod.yml exec app sh -c "pnpm db:seed"

# 6. 查看服务状态
docker compose -f docker-compose.prod.yml ps
```

### 验证部署

```bash
# 检查容器状态
docker compose -f docker-compose.prod.yml ps

# 查看应用日志
docker compose -f docker-compose.prod.yml logs -f app

# 访问健康检查端点
curl https://your-domain.com/api/health

# 检查 SSL 证书
curl -I https://your-domain.com
```

## 🔧 Traefik 配置详解

### Traefik 主要特性

- **自动 HTTPS**: 自动获取和续期 Let's Encrypt SSL 证书
- **服务发现**: 自动检测 Docker 容器并配置路由
- **负载均衡**: 内置负载均衡和健康检查
- **安全头部**: 自动添加安全相关的 HTTP 头部
- **监控面板**: 提供 Web UI 监控服务状态

### 自定义域名配置

如果需要为不同服务配置不同域名：

```yaml
# 在 docker-compose.prod.yml 中添加更多路由
services:
  app:
    labels:
      # 主域名
      - 'traefik.http.routers.class-tool.rule=Host(`${DOMAIN}`)'
      # API 子域名
      - 'traefik.http.routers.class-tool-api.rule=Host(`api.${DOMAIN}`) && PathPrefix(`/api`)'
```

### SSL 证书配置

#### 使用通配符证书

如果需要通配符证书，需要配置 DNS 验证：

```toml
# 在 traefik.toml 中配置
[certificatesResolvers.letsencrypt.acme.dnsChallenge]
  provider = "cloudflare"  # 或其他 DNS 提供商
  delayBeforeCheck = 0

# 环境变量配置 DNS 提供商凭证
# Cloudflare 示例：
# CF_API_EMAIL=your@email.com
# CF_API_KEY=your-api-key
```

#### 自定义证书

如果使用自己的 SSL 证书：

```yaml
# 在 docker-compose.prod.yml 中挂载证书
services:
  traefik:
    volumes:
      - ./certs:/certs:ro
    command:
      - --providers.file.directory=/certs
```

## 💾 数据库管理

### 备份数据库

#### 自动备份

```bash
# 运行备份脚本
./scripts/backup.sh

# 设置定时备份（使用 crontab）
crontab -e

# 添加以下行（每天凌晨 2 点备份）
0 2 * * * /path/to/class-tool/scripts/backup.sh
```

#### 手动备份

```bash
# 创建备份
docker exec class-tool-postgres-prod pg_dump -U postgres class_tool > backup_$(date +%Y%m%d).sql

# 压缩备份
gzip backup_$(date +%Y%m%d).sql
```

### 恢复数据库

```bash
# 使用恢复脚本
./scripts/restore.sh ./backups/backup_20250128_120000.sql.gz

# 或手动恢复
gunzip -c backup.sql.gz | docker exec -i class-tool-postgres-prod psql -U postgres class_tool
```

## � 环境配置

### 生产环境优化

#### 数据库性能调优

编辑 `docker-compose.prod.yml` 中的 PostgreSQL 配置：

```yaml
services:
  postgres:
    command:
      - 'postgres'
      - '-c'
      - 'max_connections=200' # 最大连接数
      - '-c'
      - 'shared_buffers=256MB' # 共享缓冲区
      - '-c'
      - 'effective_cache_size=1GB' # 有效缓存大小
      - '-c'
      - 'work_mem=16MB' # 工作内存
      - '-c'
      - 'maintenance_work_mem=64MB' # 维护工作内存
```

#### 应用性能配置

在 `.env.production` 中添加：

```bash
# Node.js 性能配置
NODE_OPTIONS=--max-old-space-size=2048
UV_THREADPOOL_SIZE=128

# Next.js 构建优化
NEXT_TELEMETRY_DISABLED=1
```

### 域名和 DNS 配置

确保你的域名 DNS 记录正确指向服务器：

```bash
# A 记录指向服务器 IP
your-domain.com     A    1.2.3.4

# 可选的子域名
traefik.your-domain.com  A    1.2.3.4
api.your-domain.com      A    1.2.3.4
```

## 📊 监控和日志

### 查看日志

```bash
# 查看所有服务日志
docker compose -f docker-compose.prod.yml logs -f

# 查看应用日志
docker compose -f docker-compose.prod.yml logs -f app

# 查看数据库日志
docker compose -f docker-compose.prod.yml logs -f postgres

# 查看最近 100 行日志
docker compose -f docker-compose.prod.yml logs --tail 100 app
```

### 监控资源使用

```bash
# 查看容器资源使用情况
docker stats

# 查看磁盘使用
df -h

# 查看 Docker 磁盘使用
docker system df
```

### 清理日志和缓存

```bash
# 清理 Docker 系统
docker system prune -a

# 清理未使用的卷
docker volume prune

# 清理应用日志
docker compose -f docker-compose.prod.yml exec app sh -c "rm -rf /app/.next/cache/*"
```

## 🔄 维护和更新

### 应用更新

#### 使用部署脚本更新（推荐）

```bash
# 执行更新脚本，会自动备份数据库
./deploy.sh
```

#### 手动更新

```bash
# 1. 备份数据库
./scripts/backup.sh

# 2. 拉取最新代码
git pull origin main

# 3. 重新构建和部署
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d

# 4. 运行数据库迁移
docker compose -f docker-compose.prod.yml exec app sh -c "pnpm db:push"
```

### 服务管理

```bash
# 重启所有服务
docker compose -f docker-compose.prod.yml restart

# 重启单个服务
docker compose -f docker-compose.prod.yml restart app
docker compose -f docker-compose.prod.yml restart traefik

# 查看服务状态
docker compose -f docker-compose.prod.yml ps

# 无中断重新加载配置
docker compose -f docker-compose.prod.yml up -d
```

### 数据清理

```bash
# 清理 Docker 资源
docker system prune -af --volumes

# 清理旧的应用缓存
docker compose -f docker-compose.prod.yml exec app sh -c "rm -rf /app/.next/cache/*"

# 清理数据库（小心使用）
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d class_tool -c "VACUUM FULL ANALYZE;"
```

### SSL 证书管理

Traefik 会自动管理 Let's Encrypt 证书，包括续期。如需查看证书状态：

```bash
# 查看证书文件
docker compose -f docker-compose.prod.yml exec traefik ls -la /letsencrypt/

# 检查证书有效期
echo | openssl s_client -servername your-domain.com -connect your-domain.com:443 2>/dev/null | openssl x509 -noout -dates
```

### 停止服务

```bash
# 停止服务（保留数据）
docker compose -f docker-compose.prod.yml down

# 停止并删除所有数据（危险操作！）
docker compose -f docker-compose.prod.yml down -v
rm -rf data/
```

## 🐛 常见问题

### 1. 端口被占用

```bash
# 查看端口占用
sudo lsof -i :3000
sudo lsof -i :5432

# 修改 .env.production 中的端口配置
APP_PORT=3001
POSTGRES_PORT=5433
```

### 2. 容器无法启动

```bash
# 查看详细日志
docker compose -f docker-compose.prod.yml logs app

# 检查环境变量
docker compose -f docker-compose.prod.yml config

# 重新构建
docker compose -f docker-compose.prod.yml build --no-cache
```

### 3. 数据库连接失败

```bash
# 检查数据库容器状态
docker compose -f docker-compose.prod.yml ps postgres

# 测试数据库连接
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -c '\l'

# 查看数据库日志
docker compose -f docker-compose.prod.yml logs postgres

# 检查数据库健康状态
docker compose -f docker-compose.prod.yml exec postgres pg_isready -U postgres
```

### 4. 应用性能问题

```bash
# 检查资源使用
docker stats

# 优化数据库
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d class_tool -c 'VACUUM ANALYZE;'

# 清理应用缓存
docker compose -f docker-compose.prod.yml exec app sh -c "rm -rf /app/.next/cache/*"
docker compose -f docker-compose.prod.yml restart app
```

### 5. SSL 证书问题

```bash
# 检查证书获取状态
docker compose -f docker-compose.prod.yml logs traefik | grep -i "certificate"

# 检查域名解析
nslookup your-domain.com

# 手动触发证书获取
docker compose -f docker-compose.prod.yml restart traefik

# 检查 acme.json 权限
ls -la data/letsencrypt/acme.json
```

### 6. 磁盘空间不足

```bash
# 清理 Docker 系统
docker system prune -af --volumes

# 清理旧备份（保留30天）
find ./backups -name "*.sql.gz" -mtime +30 -delete

# 清理应用缓存
docker compose -f docker-compose.prod.yml exec app sh -c "rm -rf /app/.next/cache/*"

# 检查磁盘使用情况
df -h
du -sh data/*
```

## � 性能监控

### 系统监控

```bash
# 查看容器资源使用
docker stats

# 查看系统资源
htop
iostat -x 1

# 查看网络连接
netstat -tulpn | grep :443
netstat -tulpn | grep :80
```

### 应用监控

```bash
# 查看应用健康状态
curl -s https://your-domain.com/api/health | jq

# 查看 Traefik Dashboard
# 访问 https://traefik.your-domain.com

# 检查数据库性能
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d class_tool -c "
SELECT
  datname,
  numbackends as connections,
  xact_commit,
  xact_rollback,
  blks_read,
  blks_hit,
  tup_returned,
  tup_fetched,
  tup_inserted,
  tup_updated,
  tup_deleted
FROM pg_stat_database
WHERE datname = 'class_tool';
"
```

## 🔐 安全建议

### 基础安全

1. **更改默认密码**: 修改 Traefik Dashboard 默认密码
2. **防火墙配置**: 只开放必要端口 (80, 443)
3. **定期更新**: 保持系统和 Docker 镜像更新
4. **备份策略**: 配置自动备份和异地备份

### 高级安全

```bash
# 配置防火墙（Ubuntu/Debian）
sudo ufw enable
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS

# 禁用不必要的服务
sudo systemctl disable --now apache2 2>/dev/null || true
sudo systemctl disable --now nginx 2>/dev/null || true

# 配置自动安全更新
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

## �📞 技术支持

### 故障排查流程

1. **查看服务状态**: `docker compose -f docker-compose.prod.yml ps`
2. **检查应用日志**: `docker compose -f docker-compose.prod.yml logs -f app`
3. **检查 Traefik 日志**: `docker compose -f docker-compose.prod.yml logs -f traefik`
4. **验证配置**: `docker compose -f docker-compose.prod.yml config`
5. **测试数据库**: `docker compose -f docker-compose.prod.yml exec postgres pg_isready -U postgres`

### 常用调试命令

```bash
# 进入应用容器
docker compose -f docker-compose.prod.yml exec app sh

# 进入数据库容器
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres -d class_tool

# 查看实时日志
docker compose -f docker-compose.prod.yml logs -f --tail=100

# 检查网络连接
docker compose -f docker-compose.prod.yml exec app wget -qO- http://postgres:5432 || echo "Database not reachable"
```

## 📚 相关文档

- [开发环境搭建](./development-setup.md)
- [性能优化指南](./performance-optimization.md)
- [功能特性说明](../features/)
- [API 文档](./api-documentation.md)
