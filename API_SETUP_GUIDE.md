# Magic Eraser API Setup Guide

This guide will help you set up different AI providers for the magic eraser functionality.

## 🎯 Quick Recommendations

### For Beginners (Free)
- **Hugging Face**: Free tier with rate limits, good for testing
- **IOPaint**: Completely free, runs locally, requires setup

### For Professional Use (Paid)
- **ClipDrop**: Best quality, optimized for object removal (~$0.02-0.05/image)
- **OpenAI DALL-E 3**: Creative editing, artistic results (~$0.04-0.08/image)

### For Developers (Flexible)
- **Replicate**: Multiple models, good balance of cost and quality

## 📋 Setup Instructions

### 1. ClipDrop (Recommended for Quality)

**Pros**: Highest quality, fast processing, specialized for cleanup
**Cons**: Paid service
**Cost**: ~$0.02-0.05 per image

1. Visit [ClipDrop API](https://clipdrop.co/apis)
2. Sign up for an account
3. Subscribe to the Cleanup API plan
4. Get your API key from the dashboard
5. In the app: Select "ClipDrop" → Enter your API key

### 2. OpenAI DALL-E 3

**Pros**: Excellent for creative editing, high quality
**Cons**: More expensive, requires OpenAI account
**Cost**: ~$0.04-0.08 per image

1. Visit [OpenAI Platform](https://platform.openai.com)
2. Create an account and add billing information
3. Go to API Keys section
4. Create a new API key
5. In the app: Select "OpenAI DALL-E 3" → Enter your API key

### 3. Hugging Face (Free Option)

**Pros**: Free to use, no credit card required
**Cons**: Rate limits, slower processing, may have queues
**Cost**: Free

1. Visit [Hugging Face](https://huggingface.co)
2. Create a free account
3. Go to Settings → Access Tokens
4. Create a new token with "read" permissions
5. In the app: Select "Hugging Face" → Enter your token

### 4. Replicate

**Pros**: Multiple model options, good pricing
**Cons**: Requires account setup
**Cost**: ~$0.01-0.05 per image

1. Visit [Replicate](https://replicate.com)
2. Sign up for an account
3. Go to Account → API Tokens
4. Create a new token
5. In the app: Select "Replicate" → Enter your API key

### 5. IOPaint (Local/Free)

**Pros**: Completely free, unlimited usage, privacy-focused
**Cons**: Requires local setup, technical knowledge needed
**Cost**: Free (uses your computer)

#### Option A: Using pip
```bash
pip install iopaint
iopaint start --model=lama --port=8080
```

#### Option B: Using Docker
```bash
docker run -p 8080:8080 cwq1913/iopaint
```

#### Option C: Using conda
```bash
conda install -c conda-forge iopaint
iopaint start --model=lama --port=8080
```

Then in the app: Select "IOPaint (Local)" → Set URL to `http://localhost:8080`

## 🔧 Troubleshooting

### Common Issues

1. **"API key required" error**
   - Make sure you've entered your API key correctly
   - Check that your API key has the right permissions

2. **"Rate limit exceeded" (Hugging Face)**
   - Wait a few minutes and try again
   - Consider upgrading to a paid plan

3. **"Insufficient credits" (OpenAI/Replicate)**
   - Add billing information to your account
   - Check your account balance

4. **IOPaint connection failed**
   - Make sure IOPaint is running on the correct port
   - Check that the URL is correct (http://localhost:8080)
   - Ensure no firewall is blocking the connection

### Quality Tips

1. **For best results**: Use ClipDrop or OpenAI DALL-E 3
2. **For testing**: Start with Hugging Face (free)
3. **For privacy**: Use IOPaint locally
4. **For cost-effectiveness**: Use Replicate

## 📊 Comparison Table

| Provider | Cost | Quality | Speed | Setup Difficulty |
|----------|------|---------|-------|------------------|
| ClipDrop | $$ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| OpenAI | $$$ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| Hugging Face | Free | ⭐⭐⭐ | ⭐⭐ | ⭐ |
| Replicate | $$ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| IOPaint | Free | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

## 🚀 Getting Started

1. **First time users**: Try Hugging Face (free) to test the functionality
2. **Ready for production**: Set up ClipDrop for best quality
3. **Privacy conscious**: Install IOPaint locally
4. **Creative projects**: Use OpenAI DALL-E 3

## 💡 Pro Tips

- Start with a free option to test the app
- ClipDrop gives the most consistent results for object removal
- IOPaint is perfect if you process many images and want to avoid API costs
- Keep your API keys secure and never share them publicly
