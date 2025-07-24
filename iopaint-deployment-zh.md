# IOPaint 部署方案

## 概述

IOPaint 是一个开源的图像修复工具，支持多种AI模型进行图像修复和物体移除。本文档详细介绍了IOPaint在不同环境下的部署方案，包括本地部署、Docker部署和云服务器部署。

## 部署选项对比

| 部署方式 | 优势 | 劣势 | 适用场景 |
|---------|------|------|----------|
| 本地部署 | 性能最佳，完全控制 | 需要技术知识，维护成本高 | 开发测试，高性能需求 |
| Docker部署 | 环境隔离，易于管理 | 性能略有损失 | 生产环境，团队协作 |
| 云服务器 | 可扩展，高可用 | 成本较高，网络延迟 | 商业应用，大规模使用 |

## 本地部署方案

### 系统要求

**最低配置**:
- 操作系统: Windows 10+, macOS 10.15+, Ubuntu 18.04+
- CPU: Intel i5 / AMD Ryzen 5 (4核心)
- 内存: 8GB RAM
- 存储: 10GB 可用空间
- Python: 3.8-3.11

**推荐配置**:
- CPU: Intel i7 / AMD Ryzen 7 / Apple M1+ (8核+)
- 内存: 16GB+ RAM
- GPU: NVIDIA GTX 1060+ / RTX 3060+ (可选，显著提升性能)
- 存储: SSD 20GB+
- Python: 3.9-3.11

### 安装步骤

#### 1. 环境准备
```bash
# 检查Python版本
python3 --version

# 创建虚拟环境
python3 -m venv iopaint_env

# 激活虚拟环境
# macOS/Linux:
source iopaint_env/bin/activate
# Windows:
iopaint_env\Scripts\activate
```

#### 2. 安装IOPaint
```bash
# 升级pip
pip install --upgrade pip

# 安装IOPaint
pip install iopaint

# 验证安装
iopaint --help
```

#### 3. GPU支持 (可选)
```bash
# NVIDIA GPU支持
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118

# Apple Silicon (M1/M2) 支持
# IOPaint会自动检测并使用MPS设备
```

#### 4. 启动服务
```bash
# 基础启动
iopaint start --model=lama --port=8080

# 完整配置启动
iopaint start \
    --model=lama \
    --port=8080 \
    --host=0.0.0.0 \
    --no-half \
    --cpu-offload \
    --disable-nsfw \
    --enable-interactive-seg
```

### 自动化脚本

项目提供了自动化安装脚本：

**macOS/Linux**:
```bash
chmod +x setup-iopaint.sh
./setup-iopaint.sh
./start_iopaint.sh
```

**Windows**:
```cmd
setup-iopaint.bat
start_iopaint.bat
```

## Docker 部署方案

### 使用官方镜像

#### 1. 基础部署
```bash
# 拉取镜像
docker pull cwq1913/iopaint:latest

# 运行容器
docker run -d \
  --name iopaint \
  -p 8080:8080 \
  cwq1913/iopaint:latest
```

#### 2. 持久化存储
```bash
# 创建数据目录
mkdir -p ./iopaint_data/models

# 运行容器并挂载数据卷
docker run -d \
  --name iopaint \
  -p 8080:8080 \
  -v $(pwd)/iopaint_data:/app/data \
  -v $(pwd)/iopaint_data/models:/app/models \
  cwq1913/iopaint:latest
```

#### 3. GPU支持
```bash
# 需要安装nvidia-docker2
docker run -d \
  --name iopaint \
  --gpus all \
  -p 8080:8080 \
  -v $(pwd)/iopaint_data:/app/data \
  cwq1913/iopaint:latest
```

### 自定义Docker镜像

#### Dockerfile示例
```dockerfile
FROM python:3.9-slim

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 安装IOPaint
RUN pip install --no-cache-dir iopaint

# 创建模型目录
RUN mkdir -p /app/models

# 暴露端口
EXPOSE 8080

# 启动命令
CMD ["iopaint", "start", "--model=lama", "--port=8080", "--host=0.0.0.0"]
```

#### 构建和运行
```bash
# 构建镜像
docker build -t my-iopaint .

# 运行容器
docker run -d -p 8080:8080 my-iopaint
```

## 云服务器部署方案

### AWS EC2 部署

#### 1. 实例选择
**推荐配置**:
- 实例类型: t3.large (2 vCPU, 8GB RAM) 或更高
- 存储: 20GB+ EBS
- 操作系统: Ubuntu 20.04 LTS
- 安全组: 开放8080端口

#### 2. 部署步骤
```bash
# 连接到EC2实例
ssh -i your-key.pem ubuntu@your-ec2-ip

# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装Python和依赖
sudo apt install python3 python3-pip python3-venv -y

# 克隆部署脚本
wget https://raw.githubusercontent.com/your-repo/setup-iopaint.sh
chmod +x setup-iopaint.sh
./setup-iopaint.sh

# 启动服务
./start_iopaint.sh
```

#### 3. 系统服务配置
```bash
# 创建systemd服务文件
sudo tee /etc/systemd/system/iopaint.service > /dev/null <<EOF
[Unit]
Description=IOPaint Service
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu
Environment=PATH=/home/ubuntu/iopaint_env/bin
ExecStart=/home/ubuntu/iopaint_env/bin/iopaint start --model=lama --port=8080 --host=0.0.0.0
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# 启用并启动服务
sudo systemctl enable iopaint
sudo systemctl start iopaint
sudo systemctl status iopaint
```

### Google Cloud Platform 部署

#### 1. Compute Engine 实例
```bash
# 创建实例
gcloud compute instances create iopaint-server \
    --zone=us-central1-a \
    --machine-type=e2-standard-2 \
    --image-family=ubuntu-2004-lts \
    --image-project=ubuntu-os-cloud \
    --boot-disk-size=20GB \
    --tags=iopaint-server

# 配置防火墙规则
gcloud compute firewall-rules create allow-iopaint \
    --allow tcp:8080 \
    --source-ranges 0.0.0.0/0 \
    --target-tags iopaint-server
```

### 阿里云 ECS 部署

#### 1. 实例配置
- 实例规格: ecs.t6-c2m4.large (2核4GB) 或更高
- 镜像: Ubuntu 20.04
- 系统盘: 40GB SSD
- 安全组: 开放8080端口

#### 2. 部署命令
```bash
# 连接ECS实例
ssh root@your-ecs-ip

# 安装Docker (推荐)
curl -fsSL https://get.docker.com | bash -s docker

# 启动IOPaint
docker run -d \
  --name iopaint \
  --restart=always \
  -p 8080:8080 \
  cwq1913/iopaint:latest
```

## 性能优化

### 1. 模型优化
```bash
# 使用不同模型
iopaint start --model=lama        # 平衡性能和质量
iopaint start --model=ldm         # 更好质量，更慢
iopaint start --model=mat         # 适合人像
iopaint start --model=fcf         # 快速处理
```

### 2. 硬件优化
```bash
# GPU加速
iopaint start --model=lama --device=cuda

# Apple Silicon优化
iopaint start --model=lama --device=mps

# CPU优化
iopaint start --model=lama --cpu-offload --no-half
```

### 3. 内存优化
```bash
# 低内存模式
iopaint start --model=lama --low-mem

# 启用CPU卸载
iopaint start --model=lama --cpu-offload
```

## 监控和维护

### 1. 健康检查
```bash
# 检查服务状态
curl http://localhost:8080/api/v1/model

# 检查系统资源
htop
nvidia-smi  # GPU使用情况
```

### 2. 日志管理
```bash
# 查看IOPaint日志
journalctl -u iopaint -f

# Docker日志
docker logs iopaint -f
```

### 3. 备份和恢复
```bash
# 备份模型文件
tar -czf iopaint_models_backup.tar.gz ./iopaint_env/lib/python*/site-packages/iopaint/

# 备份配置
cp -r ~/.iopaint iopaint_config_backup/
```

## 故障排除

### 常见问题

#### 1. 端口占用
```bash
# 查找占用端口的进程
lsof -i :8080
netstat -tulpn | grep 8080

# 杀死进程
kill -9 <PID>
```

#### 2. 内存不足
```bash
# 启用交换空间
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

#### 3. 模型下载失败
```bash
# 手动下载模型
mkdir -p ~/.cache/iopaint
cd ~/.cache/iopaint
wget https://github.com/Sanster/models/releases/download/add_big_lama/big-lama.pt
```

#### 4. GPU不可用
```bash
# 检查CUDA安装
nvidia-smi
python -c "import torch; print(torch.cuda.is_available())"

# 重新安装PyTorch
pip uninstall torch torchvision
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
```

## 安全配置

### 1. 网络安全
```bash
# 使用nginx反向代理
sudo apt install nginx

# nginx配置示例
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 2. 访问控制
```bash
# 限制访问IP
iopaint start --model=lama --host=127.0.0.1  # 仅本地访问
```

### 3. HTTPS配置
```bash
# 使用Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 成本分析

### 云服务器成本估算

**AWS EC2 (美国东部)**:
- t3.large: ~$67/月
- t3.xlarge: ~$134/月
- 流量费用: ~$0.09/GB

**阿里云 ECS (华东1)**:
- ecs.t6-c2m4.large: ~¥200/月
- ecs.c6.xlarge: ~¥400/月
- 流量费用: ~¥0.8/GB

**Google Cloud (us-central1)**:
- e2-standard-2: ~$49/月
- e2-standard-4: ~$98/月
- 流量费用: ~$0.12/GB

### 本地部署成本
- 硬件投入: ¥5000-15000 (一次性)
- 电费: ~¥50-100/月
- 维护成本: 时间投入

## 总结

IOPaint提供了灵活的部署选项，从本地开发到云端生产环境都有相应的解决方案。选择合适的部署方式需要考虑性能需求、成本预算、技术能力和维护资源等因素。

**推荐方案**:
- **开发测试**: 本地部署 + 自动化脚本
- **小规模生产**: Docker部署 + 云服务器
- **大规模生产**: Kubernetes集群 + 负载均衡
