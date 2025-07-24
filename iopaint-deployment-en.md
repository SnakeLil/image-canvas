# IOPaint Deployment Guide

## Overview

IOPaint is an open-source image inpainting tool that supports multiple AI models for image restoration and object removal. This document provides detailed deployment solutions for IOPaint in different environments, including local deployment, Docker deployment, and cloud server deployment.

## Deployment Options Comparison

| Deployment Method | Advantages | Disadvantages | Use Cases |
|------------------|------------|---------------|-----------|
| Local Deployment | Best performance, full control | Requires technical knowledge, high maintenance cost | Development testing, high performance needs |
| Docker Deployment | Environment isolation, easy management | Slight performance loss | Production environment, team collaboration |
| Cloud Server | Scalable, high availability | Higher cost, network latency | Commercial applications, large-scale usage |

## Local Deployment Solution

### System Requirements

**Minimum Configuration**:
- OS: Windows 10+, macOS 10.15+, Ubuntu 18.04+
- CPU: Intel i5 / AMD Ryzen 5 (4 cores)
- Memory: 8GB RAM
- Storage: 10GB available space
- Python: 3.8-3.11

**Recommended Configuration**:
- CPU: Intel i7 / AMD Ryzen 7 / Apple M1+ (8+ cores)
- Memory: 16GB+ RAM
- GPU: NVIDIA GTX 1060+ / RTX 3060+ (optional, significantly improves performance)
- Storage: SSD 20GB+
- Python: 3.9-3.11

### Installation Steps

#### 1. Environment Setup
```bash
# Check Python version
python3 --version

# Create virtual environment
python3 -m venv iopaint_env

# Activate virtual environment
# macOS/Linux:
source iopaint_env/bin/activate
# Windows:
iopaint_env\Scripts\activate
```

#### 2. Install IOPaint
```bash
# Upgrade pip
pip install --upgrade pip

# Install IOPaint
pip install iopaint

# Verify installation
iopaint --help
```

#### 3. GPU Support (Optional)
```bash
# NVIDIA GPU support
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118

# Apple Silicon (M1/M2) support
# IOPaint automatically detects and uses MPS device
```

#### 4. Start Service
```bash
# Basic startup
iopaint start --model=lama --port=8080

# Full configuration startup
iopaint start \
    --model=lama \
    --port=8080 \
    --host=0.0.0.0 \
    --no-half \
    --cpu-offload \
    --disable-nsfw \
    --enable-interactive-seg
```

### Automated Scripts

The project provides automated installation scripts:

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

## Docker Deployment Solution

### Using Official Image

#### 1. Basic Deployment
```bash
# Pull image
docker pull cwq1913/iopaint:latest

# Run container
docker run -d \
  --name iopaint \
  -p 8080:8080 \
  cwq1913/iopaint:latest
```

#### 2. Persistent Storage
```bash
# Create data directory
mkdir -p ./iopaint_data/models

# Run container with volume mounts
docker run -d \
  --name iopaint \
  -p 8080:8080 \
  -v $(pwd)/iopaint_data:/app/data \
  -v $(pwd)/iopaint_data/models:/app/models \
  cwq1913/iopaint:latest
```

#### 3. GPU Support
```bash
# Requires nvidia-docker2 installation
docker run -d \
  --name iopaint \
  --gpus all \
  -p 8080:8080 \
  -v $(pwd)/iopaint_data:/app/data \
  cwq1913/iopaint:latest
```

### Custom Docker Image

#### Dockerfile Example
```dockerfile
FROM python:3.9-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install IOPaint
RUN pip install --no-cache-dir iopaint

# Create models directory
RUN mkdir -p /app/models

# Expose port
EXPOSE 8080

# Start command
CMD ["iopaint", "start", "--model=lama", "--port=8080", "--host=0.0.0.0"]
```

#### Build and Run
```bash
# Build image
docker build -t my-iopaint .

# Run container
docker run -d -p 8080:8080 my-iopaint
```

## Cloud Server Deployment Solution

### AWS EC2 Deployment

#### 1. Instance Selection
**Recommended Configuration**:
- Instance Type: t3.large (2 vCPU, 8GB RAM) or higher
- Storage: 20GB+ EBS
- OS: Ubuntu 20.04 LTS
- Security Group: Open port 8080

#### 2. Deployment Steps
```bash
# Connect to EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Python and dependencies
sudo apt install python3 python3-pip python3-venv -y

# Download deployment script
wget https://raw.githubusercontent.com/your-repo/setup-iopaint.sh
chmod +x setup-iopaint.sh
./setup-iopaint.sh

# Start service
./start_iopaint.sh
```

#### 3. System Service Configuration
```bash
# Create systemd service file
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

# Enable and start service
sudo systemctl enable iopaint
sudo systemctl start iopaint
sudo systemctl status iopaint
```

### Google Cloud Platform Deployment

#### 1. Compute Engine Instance
```bash
# Create instance
gcloud compute instances create iopaint-server \
    --zone=us-central1-a \
    --machine-type=e2-standard-2 \
    --image-family=ubuntu-2004-lts \
    --image-project=ubuntu-os-cloud \
    --boot-disk-size=20GB \
    --tags=iopaint-server

# Configure firewall rules
gcloud compute firewall-rules create allow-iopaint \
    --allow tcp:8080 \
    --source-ranges 0.0.0.0/0 \
    --target-tags iopaint-server
```

### Alibaba Cloud ECS Deployment

#### 1. Instance Configuration
- Instance Spec: ecs.t6-c2m4.large (2 cores 4GB) or higher
- Image: Ubuntu 20.04
- System Disk: 40GB SSD
- Security Group: Open port 8080

#### 2. Deployment Commands
```bash
# Connect to ECS instance
ssh root@your-ecs-ip

# Install Docker (recommended)
curl -fsSL https://get.docker.com | bash -s docker

# Start IOPaint
docker run -d \
  --name iopaint \
  --restart=always \
  -p 8080:8080 \
  cwq1913/iopaint:latest
```

## Performance Optimization

### 1. Model Optimization
```bash
# Use different models
iopaint start --model=lama        # Balance performance and quality
iopaint start --model=ldm         # Better quality, slower
iopaint start --model=mat         # Suitable for portraits
iopaint start --model=fcf         # Fast processing
```

### 2. Hardware Optimization
```bash
# GPU acceleration
iopaint start --model=lama --device=cuda

# Apple Silicon optimization
iopaint start --model=lama --device=mps

# CPU optimization
iopaint start --model=lama --cpu-offload --no-half
```

### 3. Memory Optimization
```bash
# Low memory mode
iopaint start --model=lama --low-mem

# Enable CPU offload
iopaint start --model=lama --cpu-offload
```

## Monitoring and Maintenance

### 1. Health Checks
```bash
# Check service status
curl http://localhost:8080/api/v1/model

# Check system resources
htop
nvidia-smi  # GPU usage
```

### 2. Log Management
```bash
# View IOPaint logs
journalctl -u iopaint -f

# Docker logs
docker logs iopaint -f
```

### 3. Backup and Recovery
```bash
# Backup model files
tar -czf iopaint_models_backup.tar.gz ./iopaint_env/lib/python*/site-packages/iopaint/

# Backup configuration
cp -r ~/.iopaint iopaint_config_backup/
```

## Troubleshooting

### Common Issues

#### 1. Port Occupied
```bash
# Find process using port
lsof -i :8080
netstat -tulpn | grep 8080

# Kill process
kill -9 <PID>
```

#### 2. Out of Memory
```bash
# Enable swap space
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

#### 3. Model Download Failed
```bash
# Manually download model
mkdir -p ~/.cache/iopaint
cd ~/.cache/iopaint
wget https://github.com/Sanster/models/releases/download/add_big_lama/big-lama.pt
```

#### 4. GPU Unavailable
```bash
# Check CUDA installation
nvidia-smi
python -c "import torch; print(torch.cuda.is_available())"

# Reinstall PyTorch
pip uninstall torch torchvision
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
```

## Security Configuration

### 1. Network Security
```bash
# Use nginx reverse proxy
sudo apt install nginx

# nginx configuration example
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

### 2. Access Control
```bash
# Restrict access IP
iopaint start --model=lama --host=127.0.0.1  # Local access only
```

### 3. HTTPS Configuration
```bash
# Use Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Cost Analysis

### Cloud Server Cost Estimation

**AWS EC2 (US East)**:
- t3.large: ~$67/month
- t3.xlarge: ~$134/month
- Traffic cost: ~$0.09/GB

**Alibaba Cloud ECS (East China 1)**:
- ecs.t6-c2m4.large: ~¥200/month
- ecs.c6.xlarge: ~¥400/month
- Traffic cost: ~¥0.8/GB

**Google Cloud (us-central1)**:
- e2-standard-2: ~$49/month
- e2-standard-4: ~$98/month
- Traffic cost: ~$0.12/GB

### Local Deployment Cost
- Hardware investment: $800-2500 (one-time)
- Electricity: ~$10-20/month
- Maintenance cost: Time investment

## Summary

IOPaint provides flexible deployment options, from local development to cloud production environments. Choosing the right deployment method requires considering performance requirements, budget constraints, technical capabilities, and maintenance resources.

**Recommended Solutions**:
- **Development Testing**: Local deployment + automated scripts
- **Small-scale Production**: Docker deployment + cloud server
- **Large-scale Production**: Kubernetes cluster + load balancing
