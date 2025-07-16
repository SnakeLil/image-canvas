# AI-Powered Image Object Remover

A professional-grade web application for removing unwanted objects from images using AI inpainting technology.

## Features

- **Canvas-based Image Editor**: Precision brush tools with adjustable size and opacity
- **AI-Powered Object Removal**: Integration with multiple AI services for seamless object removal
- **Multiple AI Providers**: Support for Replicate, Hugging Face, and local/self-hosted APIs
- **Responsive Design**: Works flawlessly across desktop, tablet, and mobile devices
- **Advanced Editing Tools**: Zoom in/out, undo/redo, and touch support for mobile
- **Professional UI**: Clean, modern interface with intuitive controls

## Supported AI Services

### 1. Replicate API (Recommended)
- **Model**: Stable Diffusion Inpainting
- **Quality**: High-quality results
- **Cost**: ~$0.01-0.05 per image
- **Setup**: 
  1. Sign up at [replicate.com](https://replicate.com)
  2. Get API key from [Account → API Tokens](https://replicate.com/account/api-tokens)
  3. Configure in app settings

### 2. Hugging Face Inference API
- **Model**: runwayml/stable-diffusion-inpainting
- **Quality**: Good results with rate limits
- **Cost**: Free tier available
- **Setup**:
  1. Sign up at [huggingface.co](https://huggingface.co)
  2. Get API key from [Settings → Access Tokens](https://huggingface.co/settings/tokens)
  3. Configure in app settings

### 3. Local/Self-hosted API
- **Model**: Your own Stable Diffusion setup
- **Quality**: Depends on your hardware
- **Cost**: Free (after setup)
- **Setup**: See local server setup below

## Local Server Setup

For maximum control and privacy, you can run the AI model locally:

### Requirements
```bash
pip install fastapi uvicorn torch torchvision diffusers pillow python-multipart
```

### Running the Local Server
```bash
python lib/local-inpainting-server.py
```

The server will be available at `http://localhost:8000`

### Hardware Requirements
- **Minimum**: 8GB RAM, CPU-only (slow)
- **Recommended**: 16GB RAM, NVIDIA GPU with 6GB+ VRAM
- **Optimal**: 32GB RAM, NVIDIA RTX 3080/4080 or better

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