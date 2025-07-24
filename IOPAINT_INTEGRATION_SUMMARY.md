# IOPaint 集成总结

## 概述

我已经成功将IOPaint的API调用方式和交互逻辑集成到你的项目中。现在项目直接调用IOPaint的原生API，使用了IOPaint官方前端的参数格式和处理方式。

## 主要更改

### 1. API调用方式重构 (`components/ImageEditor.tsx`)

**之前**: 使用中间层API (`/api/inpaint`)
**现在**: 直接调用IOPaint API (`http://127.0.0.1:8080/api/v1/inpaint`)

#### 关键改进:
- **Base64格式**: 使用IOPaint原生的base64图像格式
- **完整参数**: 包含所有IOPaint支持的参数
- **错误处理**: 改进的错误处理和响应解析
- **直接响应**: 处理IOPaint返回的blob格式图像

```typescript
// 新的API调用格式
const requestBody = {
  image: imageBase64,
  mask: maskBase64,
  ldm_steps: 20,
  ldm_sampler: 'plms',
  hd_strategy: 'Crop',
  hd_strategy_crop_trigger_size: 800,
  hd_strategy_crop_margin: 128,
  hd_strategy_resize_limit: 1280,
  // ... 更多IOPaint参数
};

const response = await fetch(`${apiConfig.baseUrl}/api/v1/inpaint`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(requestBody)
});
```

### 2. 画布交互优化 (`components/CanvasEditor.tsx`)

参考IOPaint的画布实现，改进了绘制逻辑:

#### 线条绘制改进:
- **平滑线条**: 使用`lineTo`和`moveTo`创建连续线条
- **圆形笔刷**: `lineCap: 'round'` 和 `lineJoin: 'round'`
- **连续绘制**: 记录上一个点位置，创建平滑路径

```typescript
// 改进的绘制逻辑
if (!lastPoint.current) {
  // 第一个点：绘制圆形
  maskCtx.beginPath();
  maskCtx.arc(coords.x, coords.y, brushSettings.size / 2, 0, 2 * Math.PI);
  maskCtx.fill();
} else {
  // 后续点：绘制线条
  maskCtx.beginPath();
  maskCtx.moveTo(lastPoint.current.x, lastPoint.current.y);
  maskCtx.lineTo(coords.x, coords.y);
  maskCtx.stroke();
}
```

### 3. 配置简化 (`components/APIConfigModal.tsx`)

- **专注IOPaint**: 移除其他AI提供商的配置选项
- **连接测试**: 添加IOPaint服务器连接测试功能
- **设置指南**: 提供IOPaint安装和启动指南

### 4. 项目清理

- **移除依赖**: 清理不再使用的AI服务集成代码
- **类型简化**: 只保留IOPaint相关的类型定义
- **构建优化**: 解决IOPaint源码导致的构建冲突

## IOPaint参数说明

### 核心参数
- `image`: Base64编码的原始图像
- `mask`: Base64编码的蒙版图像 (白色=移除，黑色=保留)
- `ldm_steps`: LDM模型步数 (默认: 20)
- `ldm_sampler`: 采样器 (默认: 'plms')

### 高清策略参数
- `hd_strategy`: 高清处理策略 ('Crop', 'Resize', 'Original')
- `hd_strategy_crop_trigger_size`: 裁剪触发尺寸 (800)
- `hd_strategy_crop_margin`: 裁剪边距 (128)
- `hd_strategy_resize_limit`: 调整大小限制 (1280)

### Stable Diffusion参数 (如果使用SD模型)
- `sd_steps`: SD步数 (50)
- `sd_guidance_scale`: 引导比例 (7.5)
- `sd_sampler`: SD采样器 ('DPM++ 2M')
- `sd_seed`: 随机种子 (-1为随机)

## 使用方法

### 1. 启动IOPaint服务
```bash
# 使用项目提供的脚本
./setup-iopaint.sh    # 首次安装
./start_iopaint.sh    # 启动服务

# 或手动启动
iopaint start --model=lama --port=8080 --host=127.0.0.1
```

### 2. 配置前端
1. 启动前端应用: `npm run dev`
2. 点击"API Settings"按钮
3. 确认IOPaint服务器URL: `http://127.0.0.1:8080`
4. 点击"Test Connection"验证连接

### 3. 使用魔术橡皮擦
1. 上传图片
2. 用画笔涂抹要移除的区域
3. 点击"Process Image"
4. 等待IOPaint处理完成

## 性能特点

### 响应时间
- **LaMa模型**: 3-8秒 (推荐，平衡性能和质量)
- **LDM模型**: 10-20秒 (更高质量)
- **MAT模型**: 5-12秒 (适合人像)

### 图像质量
- **LaMa**: 适合大部分场景，速度快
- **LDM**: 最高质量，适合复杂场景
- **MAT**: 专门优化人像修复

### 内存使用
- **基础**: 2-4GB RAM
- **GPU加速**: 额外2-6GB VRAM
- **大图处理**: 可能需要8GB+ RAM

## 故障排除

### 常见问题

1. **连接失败**
   - 确认IOPaint服务正在运行
   - 检查端口是否正确 (默认8080)
   - 确认防火墙设置

2. **处理缓慢**
   - 尝试降低图像分辨率
   - 使用更快的模型 (如LaMa)
   - 考虑GPU加速

3. **内存不足**
   - 关闭其他应用程序
   - 使用`--low-mem`参数启动IOPaint
   - 处理较小的图像

### 调试命令
```bash
# 检查IOPaint状态
curl http://127.0.0.1:8080/api/v1/model

# 查看IOPaint日志
# (在启动IOPaint的终端中查看)

# 测试API连接
curl -X POST http://127.0.0.1:8080/api/v1/inpaint \
  -H "Content-Type: application/json" \
  -d '{"image":"data:image/png;base64,...","mask":"data:image/png;base64,..."}'
```

## 技术优势

### 1. 直接集成
- 无中间层延迟
- 完整的参数控制
- 实时错误反馈

### 2. 性能优化
- 平滑的画笔交互
- 高效的图像处理
- 优化的内存使用

### 3. 用户体验
- 简化的配置流程
- 直观的连接测试
- 清晰的错误提示

## 下一步建议

1. **测试不同模型**: 尝试LDM、MAT等模型，找到最适合的
2. **参数调优**: 根据具体需求调整步数、采样器等参数
3. **GPU加速**: 如果有NVIDIA显卡，启用GPU加速
4. **批量处理**: 考虑添加批量处理功能
5. **模型管理**: 添加模型切换功能

## 总结

通过这次集成，你的魔术橡皮擦项目现在：
- ✅ 直接使用IOPaint的原生API
- ✅ 支持IOPaint的所有参数和功能
- ✅ 提供了更好的画笔交互体验
- ✅ 简化了配置和使用流程
- ✅ 具备了完整的错误处理和调试能力

现在你可以享受IOPaint提供的高质量图像修复功能，同时保持简洁易用的用户界面！
