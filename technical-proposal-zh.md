# 魔术橡皮擦技术方案

## 项目概述

魔术橡皮擦是一个基于AI的图像修复应用，能够智能去除照片中不需要的物体。本项目采用前后端分离架构，支持多种AI服务提供商，提供从免费到专业级的解决方案。

## 技术架构

### 前端架构

#### 核心技术栈
- **框架**: Next.js 13+ with App Router
- **语言**: TypeScript 5.2+
- **UI框架**: React 18.2
- **样式**: Tailwind CSS 3.3 + shadcn/ui
- **组件库**: Radix UI
- **状态管理**: React Hooks (useState, useCallback, useEffect)
- **文件处理**: React Dropzone + HTML5 File API
- **画布操作**: HTML5 Canvas API

#### 组件架构
```
components/
├── ImageEditor.tsx          # 主编辑器组件
├── ImageUpload.tsx          # 图片上传组件
├── CanvasEditor.tsx         # 画布编辑器
├── BrushControls.tsx        # 画笔控制
├── ZoomControls.tsx         # 缩放控制
├── ProcessingModal.tsx      # 处理进度模态框
├── APIConfigModal.tsx       # API配置模态框
└── ui/                      # 基础UI组件
```

#### 核心功能实现

**1. 图像处理流程**
```typescript
// 图像上传 → 画布渲染 → 蒙版绘制 → AI处理 → 结果展示
const handleProcessImage = async (maskCanvas: HTMLCanvasElement) => {
  // 1. 尺寸匹配：确保蒙版与原图尺寸一致
  const scaleX = imageData.width / maskCanvas.width;
  const scaleY = imageData.height / maskCanvas.height;
  
  // 2. 蒙版格式转换：适配不同AI提供商要求
  // - ClipDrop & IOPaint: 白色=移除，黑色=保留
  // - Hugging Face & Replicate: 黑色=移除，白色=保留
  // - OpenAI: 透明=编辑，不透明=保留
  
  // 3. 调用统一API接口
  const result = await inpaintingService.removeObjects(request, provider, config);
}
```

**2. 画布操作系统**
- 支持可变画笔大小和透明度
- 实时预览绘制效果
- 支持缩放和平移操作
- 响应式设计，适配不同屏幕尺寸

### 后端架构

#### API路由设计
```
app/api/
└── inpaint/
    └── route.ts             # 统一的图像修复API端点
```

#### 核心API实现
```typescript
// 统一的AI服务接口
export async function POST(request: NextRequest) {
  // 1. 参数解析和验证
  const formData = await request.formData();
  const provider = formData.get('provider') as AIProvider;
  
  // 2. 图像格式转换
  const imageBuffer = await image.arrayBuffer();
  const maskBuffer = await mask.arrayBuffer();
  
  // 3. 根据提供商调用相应API
  switch (provider) {
    case 'iopaint': return handleIOPaint();
    case 'clipdrop': return handleClipDrop();
    case 'openai': return handleOpenAI();
    // ...
  }
}
```

## AI服务提供商集成

### 1. IOPaint (本地部署)
**技术特点**:
- 完全免费，本地运行
- 基于LaMa模型
- 支持多种模型切换
- 隐私保护，数据不上传

**API接口**:
```bash
POST http://localhost:8080/api/v1/inpaint
Content-Type: application/json

{
  "image": "base64_encoded_image",
  "mask": "base64_encoded_mask",
  "ldm_steps": 20,
  "ldm_sampler": "plms"
}
```

**服务器要求**:
- CPU: 2核心以上
- 内存: 4GB以上
- 存储: 2GB (模型文件)
- Python 3.8+

### 2. ClipDrop (商业API)
**技术特点**:
- 专业级图像修复质量
- 响应速度快 (1-3秒)
- 专门优化的物体移除算法
- 成本: ~$0.02-0.05/张

**API接口**:
```bash
POST https://clipdrop-api.co/cleanup/v1
x-api-key: YOUR_API_KEY
Content-Type: multipart/form-data

image_file: [binary]
mask_file: [binary]
```

### 3. OpenAI DALL-E 3
**技术特点**:
- 创意编辑能力强
- 支持复杂场景修复
- 成本: ~$0.04-0.08/张
- 处理时间: 5-15秒

### 4. Hugging Face
**技术特点**:
- 免费使用 (有限制)
- 基于Stable Diffusion
- 适合测试和学习
- 可能有排队等待

### 5. Replicate
**技术特点**:
- 多模型选择
- 灵活的参数配置
- 成本: ~$0.01-0.05/张
- 异步处理机制

## 性能分析

### 前端性能
- **首屏加载**: < 2秒 (优化后)
- **图像渲染**: 实时响应
- **内存使用**: 合理控制，及时释放Canvas资源
- **兼容性**: 支持Chrome 90+, Firefox 88+, Safari 14+

### API响应时间对比
| 提供商 | 平均响应时间 | 质量评分 | 成本 |
|--------|-------------|----------|------|
| ClipDrop | 1-3秒 | ⭐⭐⭐⭐⭐ | $$ |
| IOPaint | 3-8秒 | ⭐⭐⭐ | 免费 |
| OpenAI | 5-15秒 | ⭐⭐⭐⭐⭐ | $$$ |
| Hugging Face | 10-30秒 | ⭐⭐⭐ | 免费 |
| Replicate | 5-20秒 | ⭐⭐⭐⭐ | $$ |

## 服务器配置要求

### 前端部署 (Vercel推荐)
- **平台**: Vercel / Netlify / AWS Amplify
- **Node.js**: 18.x+
- **构建时间**: 2-5分钟
- **CDN**: 全球分发
- **成本**: 免费层足够使用

### IOPaint本地部署
**最低配置**:
- CPU: Intel i5 / AMD Ryzen 5 或同等性能
- 内存: 8GB RAM
- 存储: 10GB 可用空间
- 网络: 稳定的互联网连接

**推荐配置**:
- CPU: Intel i7 / AMD Ryzen 7 / Apple M1+
- 内存: 16GB RAM
- GPU: 支持CUDA的显卡 (可选，加速处理)
- 存储: SSD 20GB+

**Docker部署**:
```bash
docker run -p 8080:8080 \
  -v $(pwd)/models:/app/models \
  cwq1913/iopaint:latest
```

## 安全考虑

### 数据安全
- 图像数据仅在处理时临时存储
- 支持本地处理 (IOPaint)
- API密钥安全存储在客户端
- 不在服务器端持久化用户数据

### API安全
- 输入验证和清理
- 文件类型和大小限制
- 错误信息不泄露敏感信息
- 支持HTTPS传输

## 扩展性设计

### 新增AI提供商
```typescript
// 统一接口设计，易于扩展
interface InpaintingService {
  removeObjects(request: InpaintingRequest): Promise<InpaintingResponse>;
}

// 新增提供商只需实现接口
class NewProviderService implements InpaintingService {
  async removeObjects(request: InpaintingRequest) {
    // 实现具体逻辑
  }
}
```

### 功能扩展
- 批量处理支持
- 更多编辑工具 (修复、增强等)
- 历史记录和撤销功能
- 用户账户系统

## 部署建议

### 开发环境
```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev

# 3. 配置AI提供商
# 访问 http://localhost:3000 → API Settings
```

### 生产环境
```bash
# 1. 构建项目
npm run build

# 2. 部署到Vercel
vercel deploy

# 3. 配置环境变量 (如需要)
```

### IOPaint部署
```bash
# 自动化脚本
./setup-iopaint.sh    # macOS/Linux
setup-iopaint.bat     # Windows

# 启动服务
./start_iopaint.sh
```

## 总结

本技术方案提供了一个完整的、可扩展的魔术橡皮擦解决方案，支持从免费到专业级的不同需求。通过统一的API设计和模块化架构，可以轻松集成新的AI服务提供商，满足不同场景的使用需求。
