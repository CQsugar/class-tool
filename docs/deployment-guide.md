# 班主任班级管理平台 - 生产环境部署指南

本文档提供详细的生产环境部署步骤和最佳实践。

## 📋 目录

- [系统要求](#系统要求)
- [部署前准备](#部署前准备)
- [Docker 部署](#docker-部署)
- [环境配置](#环境配置)
- [数据库管理](#数据库管理)
- [SSL/HTTPS 配置](#ssl-https-配置)
- [监控和日志](#监控和日志)
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

## 🚀 Docker 部署

### 部署方式选择

本项目提供两种反向代理方案:

1. **Traefik** (推荐) - 自动 HTTPS 证书管理
2. **Nginx** - 传统反向代理,需手动配置证书

### 方式一: 使用 Traefik (推荐)

Traefik 可自动从 Let's Encrypt 获取和续期 SSL 证书。

#### 1. 配置环境变量

```bash
# 复制环境变量模板
cp .env.production.example .env.production

# 编辑环境变量（必须修改！）
nano .env.production
```

**必须修改的配置项：**

```bash
# 应用域名
NEXT_PUBLIC_APP_URL=https://your-domain.com
BETTER_AUTH_URL=https://your-domain.com
DOMAIN=your-domain.com

# 数据库密码（强密码！）
POSTGRES_PASSWORD=YOUR_STRONG_PASSWORD_HERE

# 认证密钥（使用 openssl rand -hex 32 生成）
BETTER_AUTH_SECRET=YOUR_32_CHAR_SECRET_KEY

# 数据持久化目录
DATA_DIR=./data

# 是否禁用注册（建议设为 true）
NEXT_PUBLIC_DISABLE_SIGNUP=true
```

#### 2. 配置 Traefik

编辑 `traefik.toml` 文件,修改邮箱地址（用于 Let's Encrypt 通知）:

```toml
[certificatesResolvers.letsencrypt.acme]
  email = "your-email@example.com"  # 修改为你的邮箱
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
# 使用 Traefik 配置启动
docker compose -f docker-compose.traefik.yml up -d

# 查看服务状态
docker compose -f docker-compose.traefik.yml ps

# 查看日志
docker compose -f docker-compose.traefik.yml logs -f
```

#### 5. 访问应用

- **应用地址**: https://your-domain.com
- **Traefik Dashboard**: https://traefik.your-domain.com (默认用户名/密码: admin/admin)

> ⚠️ **重要**: 生产环境务必修改 Traefik Dashboard 的认证密码!

生成新密码:

```bash
# 安装 htpasswd
sudo apt install apache2-utils

# 生成认证字符串
echo $(htpasswd -nb admin your-new-password) | sed -e s/\\$/\\$\\$/g
```

然后更新 `docker-compose.traefik.yml` 中的 `basicauth.users` 标签。

### 方式二: 使用 Nginx

如果你更喜欢传统的 Nginx 反向代理:

#### 1. 配置环境变量

```bash
cp .env.production.example .env.production
nano .env.production
```

#### 2. 生成安全密钥

```bash
# 生成 Better Auth 密钥
openssl rand -hex 32

# 生成 Redis 密码（如果使用 Redis）
openssl rand -hex 16
```

### 3. 执行部署

#### 方法一：使用部署脚本（推荐）

```bash
# 赋予执行权限
chmod +x deploy.sh

# 执行部署
./deploy.sh
```

#### 方法二：手动部署

```bash
# 构建镜像
docker compose -f docker-compose.prod.yml build

# 启动服务
docker compose -f docker-compose.prod.yml up -d

# 等待数据库就绪
sleep 10

# 运行数据库迁移
docker compose -f docker-compose.prod.yml exec app sh -c "pnpm db:push"

# 初始化种子数据（可选，仅首次部署）
docker compose -f docker-compose.prod.yml exec app sh -c "pnpm db:seed"

# 查看服务状态
docker compose -f docker-compose.prod.yml ps
```

### 4. 验证部署

```bash
# 检查容器状态
docker compose -f docker-compose.prod.yml ps

# 查看应用日志
docker compose -f docker-compose.prod.yml logs -f app

# 访问健康检查端点
curl http://localhost:3000/api/health
```

## ⚙️ 环境配置

### 启用可选服务

#### 启用 Nginx 反向代理

```bash
docker compose -f docker-compose.prod.yml --profile with-nginx up -d
```

#### 启用 Redis 缓存

```bash
docker compose -f docker-compose.prod.yml --profile with-redis up -d
```

#### 同时启用多个服务

```bash
docker compose -f docker-compose.prod.yml --profile with-nginx --profile with-redis up -d
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

## 🔒 SSL/HTTPS 配置

### 方法一：使用 Let's Encrypt（推荐）

```bash
# 安装 Certbot
sudo apt install -y certbot

# 生成证书
sudo certbot certonly --standalone -d your-domain.com

# 创建 SSL 目录
mkdir -p ssl

# 复制证书
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./ssl/key.pem
sudo chown -R $USER:$USER ./ssl

# 启用 Nginx
docker compose -f docker-compose.prod.yml --profile with-nginx up -d
```

### 方法二：使用自签名证书（仅测试）

```bash
# 创建 SSL 目录
mkdir -p ssl

# 生成自签名证书
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem -out ssl/cert.pem \
  -subj "/C=CN/ST=State/L=City/O=Organization/CN=your-domain.com"
```

### 证书自动续期

```bash
# 创建续期脚本
cat > scripts/renew-cert.sh << 'EOF'
#!/bin/bash
sudo certbot renew --quiet
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ./ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ./ssl/key.pem
docker compose -f docker-compose.prod.yml restart nginx
EOF

chmod +x scripts/renew-cert.sh

# 添加到 crontab（每月1号执行）
crontab -e
# 添加：0 3 1 * * /path/to/class-tool/scripts/renew-cert.sh
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

## 🔄 更新和维护

### 更新应用

```bash
# 拉取最新代码
git pull origin main

# 重新部署
./deploy.sh

# 或手动更新
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
```

### 重启服务

```bash
# 重启所有服务
docker compose -f docker-compose.prod.yml restart

# 重启单个服务
docker compose -f docker-compose.prod.yml restart app

# 重新加载配置（无中断）
docker compose -f docker-compose.prod.yml up -d
```

### 停止服务

```bash
# 停止服务（保留数据）
docker compose -f docker-compose.prod.yml down

# 停止服务并删除卷（危险！会删除所有数据）
docker compose -f docker-compose.prod.yml down -v
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

### 5. 磁盘空间不足

```bash
# 清理 Docker 系统
docker system prune -a --volumes

# 清理旧备份
find ./backups -name "*.sql.gz" -mtime +30 -delete

# 清理日志
docker compose -f docker-compose.prod.yml exec app sh -c "truncate -s 0 /app/logs/*.log"
```

## 📞 技术支持

如遇到问题，请：

1. 查看应用日志：`docker compose -f docker-compose.prod.yml logs -f app`
2. 检查环境配置：`docker compose -f docker-compose.prod.yml config`
3. 验证数据库连接：`docker compose -f docker-compose.prod.yml exec app sh -c "pnpm prisma db pull"`
4. 联系技术支持

## 📚 相关文档

- [开发环境搭建](./development-setup.md)
- [数据库备份与恢复](./database-backup.md)
- [性能优化指南](./performance-optimization.md)
- [安全最佳实践](./security-best-practices.md)
