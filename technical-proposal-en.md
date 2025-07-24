# Magic Eraser Technical Proposal

## Project Overview

Magic Eraser is an AI-powered image inpainting application that intelligently removes unwanted objects from photos. This project adopts a frontend-backend separation architecture, supports multiple AI service providers, and offers solutions ranging from free to professional-grade.

## Technical Architecture

### Frontend Architecture

#### Core Technology Stack
- **Framework**: Next.js 13+ with App Router
- **Language**: TypeScript 5.2+
- **UI Framework**: React 18.2
- **Styling**: Tailwind CSS 3.3 + shadcn/ui
- **Component Library**: Radix UI
- **State Management**: React Hooks (useState, useCallback, useEffect)
- **File Processing**: React Dropzone + HTML5 File API
- **Canvas Operations**: HTML5 Canvas API

#### Component Architecture
```
components/
├── ImageEditor.tsx          # Main editor component
├── ImageUpload.tsx          # Image upload component
├── CanvasEditor.tsx         # Canvas editor
├── BrushControls.tsx        # Brush controls
├── ZoomControls.tsx         # Zoom controls
├── ProcessingModal.tsx      # Processing progress modal
├── APIConfigModal.tsx       # API configuration modal
└── ui/                      # Base UI components
```

#### Core Feature Implementation

**1. Image Processing Pipeline**
```typescript
// Image Upload → Canvas Rendering → Mask Drawing → AI Processing → Result Display
const handleProcessImage = async (maskCanvas: HTMLCanvasElement) => {
  // 1. Size Matching: Ensure mask matches original image dimensions
  const scaleX = imageData.width / maskCanvas.width;
  const scaleY = imageData.height / maskCanvas.height;
  
  // 2. Mask Format Conversion: Adapt to different AI provider requirements
  // - ClipDrop & IOPaint: White=remove, Black=keep
  // - Hugging Face & Replicate: Black=remove, White=keep
  // - OpenAI: Transparent=edit, Opaque=keep
  
  // 3. Call unified API interface
  const result = await inpaintingService.removeObjects(request, provider, config);
}
```

**2. Canvas Operation System**
- Variable brush size and opacity support
- Real-time drawing preview
- Zoom and pan operations
- Responsive design for different screen sizes

### Backend Architecture

#### API Route Design
```
app/api/
└── inpaint/
    └── route.ts             # Unified image inpainting API endpoint
```

#### Core API Implementation
```typescript
// Unified AI service interface
export async function POST(request: NextRequest) {
  // 1. Parameter parsing and validation
  const formData = await request.formData();
  const provider = formData.get('provider') as AIProvider;
  
  // 2. Image format conversion
  const imageBuffer = await image.arrayBuffer();
  const maskBuffer = await mask.arrayBuffer();
  
  // 3. Call corresponding API based on provider
  switch (provider) {
    case 'iopaint': return handleIOPaint();
    case 'clipdrop': return handleClipDrop();
    case 'openai': return handleOpenAI();
    // ...
  }
}
```

## AI Service Provider Integration

### 1. IOPaint (Local Deployment)
**Technical Features**:
- Completely free, runs locally
- Based on LaMa model
- Supports multiple model switching
- Privacy protection, no data upload

**API Interface**:
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

**Server Requirements**:
- CPU: 2+ cores
- Memory: 4GB+
- Storage: 2GB (model files)
- Python 3.8+

### 2. ClipDrop (Commercial API)
**Technical Features**:
- Professional-grade image inpainting quality
- Fast response time (1-3 seconds)
- Specialized object removal algorithm
- Cost: ~$0.02-0.05/image

**API Interface**:
```bash
POST https://clipdrop-api.co/cleanup/v1
x-api-key: YOUR_API_KEY
Content-Type: multipart/form-data

image_file: [binary]
mask_file: [binary]
```

### 3. OpenAI DALL-E 3
**Technical Features**:
- Strong creative editing capabilities
- Supports complex scene restoration
- Cost: ~$0.04-0.08/image
- Processing time: 5-15 seconds

### 4. Hugging Face
**Technical Features**:
- Free to use (with limitations)
- Based on Stable Diffusion
- Suitable for testing and learning
- May have queue waiting

### 5. Replicate
**Technical Features**:
- Multiple model options
- Flexible parameter configuration
- Cost: ~$0.01-0.05/image
- Asynchronous processing mechanism

## Performance Analysis

### Frontend Performance
- **First Screen Load**: < 2 seconds (optimized)
- **Image Rendering**: Real-time response
- **Memory Usage**: Reasonable control, timely Canvas resource release
- **Compatibility**: Supports Chrome 90+, Firefox 88+, Safari 14+

### API Response Time Comparison
| Provider | Avg Response Time | Quality Score | Cost |
|----------|------------------|---------------|------|
| ClipDrop | 1-3s | ⭐⭐⭐⭐⭐ | $$ |
| IOPaint | 3-8s | ⭐⭐⭐ | Free |
| OpenAI | 5-15s | ⭐⭐⭐⭐⭐ | $$$ |
| Hugging Face | 10-30s | ⭐⭐⭐ | Free |
| Replicate | 5-20s | ⭐⭐⭐⭐ | $$ |

## Server Configuration Requirements

### Frontend Deployment (Vercel Recommended)
- **Platform**: Vercel / Netlify / AWS Amplify
- **Node.js**: 18.x+
- **Build Time**: 2-5 minutes
- **CDN**: Global distribution
- **Cost**: Free tier sufficient

### IOPaint Local Deployment
**Minimum Configuration**:
- CPU: Intel i5 / AMD Ryzen 5 or equivalent
- Memory: 8GB RAM
- Storage: 10GB available space
- Network: Stable internet connection

**Recommended Configuration**:
- CPU: Intel i7 / AMD Ryzen 7 / Apple M1+
- Memory: 16GB RAM
- GPU: CUDA-compatible graphics card (optional, accelerates processing)
- Storage: SSD 20GB+

**Docker Deployment**:
```bash
docker run -p 8080:8080 \
  -v $(pwd)/models:/app/models \
  cwq1913/iopaint:latest
```

## Security Considerations

### Data Security
- Image data temporarily stored only during processing
- Supports local processing (IOPaint)
- API keys securely stored on client-side
- No persistent user data storage on server

### API Security
- Input validation and sanitization
- File type and size restrictions
- Error messages don't leak sensitive information
- HTTPS transmission support

## Scalability Design

### Adding New AI Providers
```typescript
// Unified interface design, easy to extend
interface InpaintingService {
  removeObjects(request: InpaintingRequest): Promise<InpaintingResponse>;
}

// New providers only need to implement the interface
class NewProviderService implements InpaintingService {
  async removeObjects(request: InpaintingRequest) {
    // Implement specific logic
  }
}
```

### Feature Extensions
- Batch processing support
- More editing tools (repair, enhancement, etc.)
- History and undo functionality
- User account system

## Deployment Recommendations

### Development Environment
```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Configure AI providers
# Visit http://localhost:3000 → API Settings
```

### Production Environment
```bash
# 1. Build project
npm run build

# 2. Deploy to Vercel
vercel deploy

# 3. Configure environment variables (if needed)
```

### IOPaint Deployment
```bash
# Automated scripts
./setup-iopaint.sh    # macOS/Linux
setup-iopaint.bat     # Windows

# Start service
./start_iopaint.sh
```

## Summary

This technical proposal provides a complete, scalable Magic Eraser solution that supports different needs from free to professional-grade. Through unified API design and modular architecture, new AI service providers can be easily integrated to meet various usage scenarios.
