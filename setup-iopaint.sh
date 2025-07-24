#!/bin/bash

# IOPaint Setup Script for Magic Eraser
# This script helps you install and run IOPaint locally for free image inpainting

echo "🎨 Magic Eraser - IOPaint Setup Script"
echo "======================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ first."
    echo "   Visit: https://www.python.org/downloads/"
    exit 1
fi

echo "✅ Python 3 found: $(python3 --version)"

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed. Please install pip first."
    exit 1
fi

echo "✅ pip3 found"

# Create virtual environment (recommended)
echo ""
echo "📦 Setting up virtual environment..."
if [ ! -d "iopaint_env" ]; then
    python3 -m venv iopaint_env
    echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment already exists"
fi

# Activate virtual environment
source iopaint_env/bin/activate
echo "✅ Virtual environment activated"

# Install IOPaint
echo ""
echo "⬇️  Installing IOPaint..."
pip install --upgrade pip
pip install iopaint

if [ $? -eq 0 ]; then
    echo "✅ IOPaint installed successfully!"
else
    echo "❌ Failed to install IOPaint"
    exit 1
fi

# Create startup script
echo ""
echo "📝 Creating startup script..."
cat > start_iopaint.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting IOPaint server..."
echo "Server will be available at: http://localhost:8080"
echo "Press Ctrl+C to stop the server"
echo ""

# Activate virtual environment
source iopaint_env/bin/activate

# Start IOPaint with recommended settings
iopaint start \
    --model=lama \
    --port=8080 \
    --host=0.0.0.0 \
    --no-half \
    --cpu-offload \
    --disable-nsfw \
    --enable-interactive-seg

EOF

chmod +x start_iopaint.sh
echo "✅ Startup script created: start_iopaint.sh"

# Create stop script
cat > stop_iopaint.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping IOPaint server..."
pkill -f "iopaint start"
echo "✅ IOPaint server stopped"
EOF

chmod +x stop_iopaint.sh
echo "✅ Stop script created: stop_iopaint.sh"

# Test installation
echo ""
echo "🧪 Testing IOPaint installation..."
if iopaint --help > /dev/null 2>&1; then
    echo "✅ IOPaint is working correctly!"
else
    echo "❌ IOPaint installation test failed"
    exit 1
fi

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "📋 Next Steps:"
echo "1. Run: ./start_iopaint.sh"
echo "2. Wait for the server to start (may take a few minutes on first run)"
echo "3. Open your Magic Eraser app at http://localhost:3001"
echo "4. Go to API Settings and select 'IOPaint (Local)'"
echo "5. Set the server URL to: http://localhost:8080"
echo ""
echo "💡 Tips:"
echo "- First run will download the AI model (~100MB)"
echo "- Keep the terminal open while using IOPaint"
echo "- Use ./stop_iopaint.sh to stop the server"
echo "- IOPaint is completely free and runs offline!"
echo ""
echo "🔧 Troubleshooting:"
echo "- If port 8080 is busy, edit start_iopaint.sh and change the port"
echo "- For GPU acceleration, install PyTorch with CUDA support"
echo "- Check the IOPaint documentation: https://github.com/Sanster/IOPaint"
echo ""

# Deactivate virtual environment
deactivate
