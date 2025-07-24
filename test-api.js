// Simple API test script for Magic Eraser
// Run with: node test-api.js

const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  // Add your API keys here for testing
  CLIPDROP_API_KEY: '', // Get from https://clipdrop.co/apis
  OPENAI_API_KEY: '', // Get from https://platform.openai.com/api-keys
  HUGGINGFACE_API_KEY: '', // Get from https://huggingface.co/settings/tokens
  REPLICATE_API_KEY: '', // Get from https://replicate.com/account/api-tokens
  IOPAINT_URL: 'http://localhost:8080' // Local IOPaint server
};

async function testAPI(provider, apiKey, baseUrl = '') {
  console.log(`\n🧪 Testing ${provider}...`);
  
  try {
    // Create a simple test image and mask (1x1 pixel for testing)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 image
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
      0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT chunk
      0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x37, 0x6E, 0xF9, 0x24, 0x00, 0x00,
      0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, // IEND chunk
      0x60, 0x82
    ]);

    const formData = new FormData();
    formData.append('provider', provider);
    formData.append('image', new Blob([testImageBuffer]), 'test.png');
    formData.append('mask', new Blob([testImageBuffer]), 'mask.png');
    formData.append('prompt', 'test');
    
    if (apiKey) {
      formData.append('apiKey', apiKey);
    }
    
    if (baseUrl) {
      formData.append('baseUrl', baseUrl);
    }

    const response = await fetch('http://localhost:3001/api/inpaint', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ ${provider}: API connection successful!`);
      return true;
    } else {
      console.log(`❌ ${provider}: ${result.error}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${provider}: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Magic Eraser API Tests...');
  console.log('Make sure the development server is running on http://localhost:3001');
  
  const results = {};
  
  // Test each provider
  if (TEST_CONFIG.CLIPDROP_API_KEY) {
    results.clipdrop = await testAPI('clipdrop', TEST_CONFIG.CLIPDROP_API_KEY);
  } else {
    console.log('\n⏭️  Skipping ClipDrop (no API key provided)');
  }
  
  if (TEST_CONFIG.OPENAI_API_KEY) {
    results.openai = await testAPI('openai', TEST_CONFIG.OPENAI_API_KEY);
  } else {
    console.log('\n⏭️  Skipping OpenAI (no API key provided)');
  }
  
  if (TEST_CONFIG.HUGGINGFACE_API_KEY) {
    results.huggingface = await testAPI('huggingface', TEST_CONFIG.HUGGINGFACE_API_KEY);
  } else {
    console.log('\n⏭️  Skipping Hugging Face (no API key provided)');
  }
  
  if (TEST_CONFIG.REPLICATE_API_KEY) {
    results.replicate = await testAPI('replicate', TEST_CONFIG.REPLICATE_API_KEY);
  } else {
    console.log('\n⏭️  Skipping Replicate (no API key provided)');
  }
  
  // Test IOPaint (local)
  results.iopaint = await testAPI('iopaint', '', TEST_CONFIG.IOPAINT_URL);
  
  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  const working = Object.entries(results).filter(([_, success]) => success);
  const failed = Object.entries(results).filter(([_, success]) => !success);
  
  if (working.length > 0) {
    console.log(`✅ Working providers: ${working.map(([name]) => name).join(', ')}`);
  }
  
  if (failed.length > 0) {
    console.log(`❌ Failed providers: ${failed.map(([name]) => name).join(', ')}`);
  }
  
  if (working.length === 0) {
    console.log('\n💡 To get started:');
    console.log('1. Add API keys to the TEST_CONFIG object in this file');
    console.log('2. Or install IOPaint locally: pip install iopaint');
    console.log('3. Run: iopaint start --model=lama --port=8080');
  }
  
  console.log('\n🎯 Next steps:');
  console.log('1. Open http://localhost:3001 in your browser');
  console.log('2. Upload an image and try the magic eraser');
  console.log('3. Configure your preferred API in the settings');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testAPI, runTests };
