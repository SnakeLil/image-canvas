# Magic Eraser - AI-Powered Image Inpainting

A professional-grade web application for removing unwanted objects from images using AI inpainting technology. Now supports 5 different AI providers including free and premium options!

## ✨ Features

- **Magic Eraser**: Remove unwanted objects with AI precision
- **5 AI Providers**: ClipDrop, OpenAI, Hugging Face, Replicate, and IOPaint
- **Free & Paid Options**: From completely free to premium quality
- **Canvas Editor**: Precision brush tools with adjustable size and opacity
- **Easy Setup**: Guided configuration with automatic setup scripts
- **Privacy Options**: Local processing with IOPaint
- **Professional UI**: Clean, modern interface with intuitive controls
- **Cross-platform**: Works on desktop, tablet, and mobile devices

## 🎯 AI Provider Options

### 🆓 Free Options

#### 1. Hugging Face (Best for Beginners)
- **Cost**: Free with rate limits
- **Quality**: Good ⭐⭐⭐
- **Speed**: Slow ⭐⭐
- **Setup**: Just need a free account
- **Best for**: Testing and learning

#### 2. IOPaint (Best Free Option)
- **Cost**: Completely free
- **Quality**: Good ⭐⭐⭐
- **Speed**: Fast ⭐⭐⭐⭐
- **Setup**: Local installation (automated scripts provided)
- **Best for**: Privacy, unlimited usage, no API costs

### 💰 Premium Options (Higher Quality)

#### 3. ClipDrop (Recommended for Production)
- **Cost**: ~$0.02-0.05 per image
- **Quality**: Excellent ⭐⭐⭐⭐⭐
- **Speed**: Very Fast ⭐⭐⭐⭐⭐
- **Setup**: API key required
- **Best for**: Professional use, highest quality

#### 4. OpenAI DALL-E 3
- **Cost**: ~$0.04-0.08 per image
- **Quality**: Excellent ⭐⭐⭐⭐⭐
- **Speed**: Medium ⭐⭐⭐⭐
- **Setup**: OpenAI account required
- **Best for**: Creative editing, artistic results

#### 5. Replicate
- **Cost**: ~$0.01-0.05 per image
- **Quality**: Very Good ⭐⭐⭐⭐
- **Speed**: Medium ⭐⭐⭐
- **Setup**: Replicate account required
- **Best for**: Flexible model selection, good balance

## 🚀 Quick Setup

### Option 1: IOPaint (Free, Local)
**Automated setup scripts provided!**

**For macOS/Linux:**
```bash
./setup-iopaint.sh
./start_iopaint.sh
```

**For Windows:**
```cmd
setup-iopaint.bat
start_iopaint.bat
```

**Manual setup:**
```bash
pip install iopaint
iopaint start --model=lama --port=8080
```

### Option 2: Cloud APIs
1. Open the app at http://localhost:3001
2. Click "API Settings"
3. Choose your preferred provider
4. Follow the setup guide for your chosen provider

See `API_SETUP_GUIDE.md` for detailed instructions for each provider.

## Getting Started

1. **Clone and Install**
   ```bash
   npm install
   npm run dev
   ```

2. **Configure AI Provider**
   - Click the "API Settings" button in the app
   - Choose your preferred AI provider
   - Enter your API key or configure local server URL

3. **Start Editing**
   - Upload an image (JPG, PNG, WebP)
   - Use the brush tool to mark areas you want to remove
   - Adjust brush size and opacity as needed
   - Click "Remove Objects" to process
   - Download the result

## API Integration Examples

### Replicate API
```typescript
const service = new ReplicateInpaintingService('your-api-key');
const result = await service.removeObjects({
  image: imageFile,
  mask: maskBlob,
  prompt: "high quality, photorealistic"
});
```

### Hugging Face API
```typescript
const service = new HuggingFaceInpaintingService('your-api-key');
const result = await service.removeObjects({
  image: imageFile,
  mask: maskBlob
});
```

### Local API
```typescript
const service = new LocalInpaintingService('http://localhost:8000');
const result = await service.removeObjects({
  image: imageFile,
  mask: maskBlob,
  prompt: "seamless, natural"
});
```

## Technical Architecture

- **Frontend**: Next.js 13+ with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Canvas**: HTML5 Canvas with optimized rendering
- **AI Integration**: Modular service architecture supporting multiple providers
- **State Management**: React hooks with optimized re-rendering
- **Performance**: Image compression, lazy loading, and efficient canvas operations

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Check the GitHub Issues page
- Review the API documentation
- Test with the local server first for debugging