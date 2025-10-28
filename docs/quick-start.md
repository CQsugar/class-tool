# 班主任班级管理平台 - 快速部署指南

## 🚀 5分钟快速部署

### 前置要求

- 已安装 Docker 和 Docker Compose
- 有一台 Linux 服务器（Ubuntu/Debian/CentOS）

### 步骤 1: 克隆项目

```bash
git clone <your-repository-url> class-tool
cd class-tool
```

### 步骤 2: 配置环境变量

```bash
# 复制环境变量模板
cp .env.production.example .env.production

# 生成安全密钥
BETTER_AUTH_SECRET=$(openssl rand -hex 32)
POSTGRES_PASSWORD=$(openssl rand -hex 16)

# 自动配置（替换为你的域名）
sed -i "s|https://your-domain.com|https://your-domain.com|g" .env.production
sed -i "s|YOUR_STRONG_PASSWORD_HERE_CHANGE_ME|$POSTGRES_PASSWORD|g" .env.production
sed -i "s|CHANGE_THIS_TO_A_STRONG_SECRET_KEY_MIN_32_CHARS_USE_OPENSSL_RAND_HEX_32|$BETTER_AUTH_SECRET|g" .env.production
```

### 步骤 3: 部署应用

```bash
# 赋予执行权限
chmod +x deploy.sh

# 执行部署
./deploy.sh
```

### 步骤 4: 访问应用

部署完成后，访问: `http://your-server-ip:3000`

默认管理员账号（如果运行了种子数据）：

- 邮箱: teacher@example.com
- 密码: （需要在数据库中设置）

## 📝 下一步

1. **配置 SSL/HTTPS**

   ```bash
   # 安装 Certbot
   sudo apt install -y certbot

   # 获取证书
   sudo certbot certonly --standalone -d your-domain.com

   # 复制证书
   mkdir -p ssl
   sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/cert.pem
   sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/key.pem
   sudo chown -R $USER:$USER ssl

   # 启用 Nginx
   docker compose -f docker-compose.prod.yml --profile with-nginx up -d
   ```

2. **设置自动备份**

   ```bash
   # 添加每日备份任务
   crontab -e

   # 添加以下行（每天凌晨2点备份）
   0 2 * * * /path/to/class-tool/scripts/backup.sh
   ```

3. **监控应用**

   ```bash
   # 查看日志
   docker compose -f docker-compose.prod.yml logs -f

   # 查看资源使用
   docker stats
   ```

## 🔧 常用命令

```bash
# 查看服务状态
docker compose -f docker-compose.prod.yml ps

# 重启服务
docker compose -f docker-compose.prod.yml restart

# 停止服务
docker compose -f docker-compose.prod.yml down

# 更新应用
git pull && ./deploy.sh

# 查看日志
docker compose -f docker-compose.prod.yml logs -f app

# 备份数据库
./scripts/backup.sh

# 恢复数据库
./scripts/restore.sh ./backups/backup_YYYYMMDD_HHMMSS.sql.gz
```

## ❓ 常见问题

### 端口被占用

修改 `.env.production` 中的 `APP_PORT` 和 `POSTGRES_PORT`

### 无法访问应用

检查防火墙设置：

```bash
sudo ufw allow 3000
sudo ufw allow 80
sudo ufw allow 443
```

### 数据库连接失败

查看数据库日志：

```bash
docker compose -f docker-compose.prod.yml logs postgres
```

## 📚 完整文档

查看 [完整部署指南](./deployment-guide.md) 了解详细配置选项。
