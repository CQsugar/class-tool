# 故障排除指南

## 常见问题和解决方案

### 1. 数据库连接失败 (Can't reach database server)

**症状**: 执行 `pnpm db:push` 或 `pnpm db:seed` 时提示无法连接到数据库

**原因**: 在宿主机上执行命令，而数据库在 Docker 容器中

**解决方案**: 在容器内执行命令

```bash
# 正确的方式 - 在容器内执行
cd /opt/class-tool
docker compose -f docker-compose.prod.yml exec app npx prisma db push
docker compose -f docker-compose.prod.yml exec app npx tsx prisma/seed.ts

# 错误的方式 - 在宿主机执行（会失败）
pnpm db:push  # ❌ 错误！
pnpm db:seed  # ❌ 错误！
```

### 2. Traefik 返回 404 Page Not Found

**症状**: 访问域名时返回 404 错误

**原因**:

1. Docker 网络名称配置不匹配
2. DNS 未正确解析到服务器
3. 应用容器不健康

**解决方案**:

#### 步骤 1: 检查服务状态

```bash
docker compose -f docker-compose.prod.yml ps
```

确保所有容器都是 `healthy` 或 `Up` 状态。

#### 步骤 2: 检查应用日志

```bash
docker compose -f docker-compose.prod.yml logs app
```

#### 步骤 3: 检查 Traefik 日志

```bash
docker compose -f docker-compose.prod.yml logs traefik
```

如果看到 "Could not find network named app-network"，需要更新配置：

1. 编辑本地的 `docker-compose.prod.yml`
2. 确保添加了网络配置：

```yaml
labels:
  traefik.docker.network: class-tool_app-network
```

3. 重新部署

#### 步骤 4: 检查 DNS 解析

```bash
# 在本地执行
nslookup www.ccsong.top

# 应该解析到你的服务器 IP
```

### 3. 应用容器不健康 (unhealthy)

**症状**: `docker compose ps` 显示应用状态为 `unhealthy`

**可能原因**:

1. 数据库未初始化
2. 环境变量配置错误
3. 应用启动失败

**解决方案**:

#### 检查健康检查

```bash
# 查看健康检查日志
docker compose -f docker-compose.prod.yml logs app | grep health

# 手动测试健康检查端点
docker compose -f docker-compose.prod.yml exec app wget -q -O- http://localhost:3000/api/health
```

#### 初始化数据库

```bash
cd /opt/class-tool
docker compose -f docker-compose.prod.yml exec app npx prisma db push
docker compose -f docker-compose.prod.yml exec app npx tsx prisma/seed.ts
```

#### 重启服务

```bash
docker compose -f docker-compose.prod.yml restart app
```

### 4. Let's Encrypt SSL 证书获取失败

**症状**: Traefik 日志中显示 ACME 错误

**原因**: DNS 记录未正确配置或域名解析有问题

**解决方案**:

1. 确保域名的 A 记录指向服务器 IP
2. 等待 DNS 传播（可能需要几分钟到几小时）
3. 检查防火墙是否开放 80 和 443 端口

```bash
# 检查防火墙
sudo ufw status

# 开放必要端口
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### 5. 环境变量未生效

**症状**: 容器中环境变量为空或使用默认值

**原因**: `.env.production` 文件未正确配置或 Docker Compose 未读取

**解决方案**:

```bash
cd /opt/class-tool

# 检查 .env 文件是否存在
ls -la .env*

# 确保 .env 文件存在（Docker Compose 读取 .env 而不是 .env.production）
cp .env.production .env

# 验证环境变量
docker compose -f docker-compose.prod.yml config | grep -A 5 environment

# 重启服务
docker compose -f docker-compose.prod.yml restart
```

## 完整的部署后检查清单

```bash
# 1. 检查所有容器状态
docker compose -f docker-compose.prod.yml ps

# 2. 检查应用日志
docker compose -f docker-compose.prod.yml logs app --tail=50

# 3. 检查 Traefik 日志
docker compose -f docker-compose.prod.yml logs traefik --tail=50

# 4. 检查数据库连接
docker compose -f docker-compose.prod.yml exec app ping -c 2 postgres

# 5. 测试健康检查
docker compose -f docker-compose.prod.yml exec app wget -q -O- http://localhost:3000/api/health

# 6. 检查环境变量
docker compose -f docker-compose.prod.yml exec app env | grep -E "DATABASE_URL|BETTER_AUTH"

# 7. 初始化数据库（首次部署）
docker compose -f docker-compose.prod.yml exec app npx prisma db push
docker compose -f docker-compose.prod.yml exec app npx tsx prisma/seed.ts

# 8. 查看生成的管理员账号
docker compose -f docker-compose.prod.yml logs app | grep -A 10 "管理员账号"
```

## 快速修复脚本

将以下内容保存为 `fix-deployment.sh`：

```bash
#!/bin/bash
cd /opt/class-tool

echo "🔧 修复部署问题..."

# 确保环境文件存在
if [ -f ".env.production" ]; then
    cp .env.production .env
    echo "✅ 环境文件已同步"
fi

# 重启所有服务
echo "🔄 重启服务..."
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 15

# 检查状态
echo "📊 服务状态:"
docker compose -f docker-compose.prod.yml ps

# 初始化数据库（如果需要）
echo "🗄️  初始化数据库..."
docker compose -f docker-compose.prod.yml exec -T app npx prisma db push || echo "⚠️  数据库已初始化或初始化失败"
docker compose -f docker-compose.prod.yml exec -T app npx tsx prisma/seed.ts || echo "⚠️  种子数据已存在或导入失败"

echo "✅ 修复完成！"
```

使用方法：

```bash
chmod +x fix-deployment.sh
./fix-deployment.sh
```
