// Test script for IOPaint API
// Run with: node test-iopaint.js

const fs = require('fs');
const path = require('path');

async function createTestImage() {
  // Create a simple 100x100 PNG image for testing
  const width = 100;
  const height = 100;
  
  // Simple PNG header + IDAT chunk for a white 100x100 image
  const pngData = Buffer.from([
    // PNG signature
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
    
    // IHDR chunk
    0x00, 0x00, 0x00, 0x0D, // chunk length
    0x49, 0x48, 0x44, 0x52, // "IHDR"
    0x00, 0x00, 0x00, 0x64, // width: 100
    0x00, 0x00, 0x00, 0x64, // height: 100
    0x08, 0x02, 0x00, 0x00, 0x00, // bit depth, color type, compression, filter, interlace
    0x4C, 0x5C, 0xF6, 0x9C, // CRC
    
    // IDAT chunk (simplified - white image)
    0x00, 0x00, 0x00, 0x16, // chunk length
    0x49, 0x44, 0x41, 0x54, // "IDAT"
    0x78, 0x9C, 0xED, 0xC1, 0x01, 0x01, 0x00, 0x00, 0x00, 0x80, 0x90, 0xFE, 0x37, 0x10, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01,
    0x7E, 0x7B, 0x00, 0x62, // CRC
    
    // IEND chunk
    0x00, 0x00, 0x00, 0x00, // chunk length
    0x49, 0x45, 0x4E, 0x44, // "IEND"
    0xAE, 0x42, 0x60, 0x82  // CRC
  ]);
  
  return pngData;
}

async function testIOPaintAPI(baseUrl = 'http://localhost:8080') {
  console.log('🧪 Testing IOPaint API...');
  console.log(`📍 Server URL: ${baseUrl}`);
  
  try {
    // First, check if IOPaint server is running
    console.log('\n1️⃣ Checking if IOPaint server is running...');
    const healthResponse = await fetch(`${baseUrl}/`);
    if (!healthResponse.ok) {
      throw new Error(`IOPaint server not responding: ${healthResponse.status}`);
    }
    console.log('✅ IOPaint server is running');
    
    // Check API documentation endpoint
    console.log('\n2️⃣ Checking API documentation...');
    try {
      const docsResponse = await fetch(`${baseUrl}/docs`);
      if (docsResponse.ok) {
        console.log('✅ API docs available at: ' + baseUrl + '/docs');
      }
    } catch (e) {
      console.log('⚠️  API docs not accessible');
    }
    
    // Create test images
    console.log('\n3️⃣ Creating test images...');
    const testImage = await createTestImage();
    const testMask = await createTestImage(); // Same image as mask for simplicity
    console.log('✅ Test images created');
    
    // Test the inpaint API
    console.log('\n4️⃣ Testing inpaint API...');

    // IOPaint expects base64 encoded images without data URL prefix
    const imageBase64 = testImage.toString('base64');
    const maskBase64 = testMask.toString('base64');

    const requestBody = {
      image: imageBase64,
      mask: maskBase64,
      ldm_steps: 20,
      ldm_sampler: 'plms',
      hd_strategy: 'Crop',
      hd_strategy_crop_trigger_size: 800,
      hd_strategy_crop_margin: 128,
      hd_strategy_resize_limit: 1280
    };

    const response = await fetch(`${baseUrl}/api/v1/inpaint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log(`📊 Response status: ${response.status}`);
    console.log(`📊 Response headers:`, Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ API Error: ${response.status} - ${response.statusText}`);
      console.log(`📄 Error details: ${errorText.substring(0, 500)}...`);
      return false;
    }
    
    const contentType = response.headers.get('content-type');
    console.log(`📊 Content-Type: ${contentType}`);
    
    if (contentType?.includes('image/')) {
      console.log('✅ IOPaint API returned an image successfully!');
      const blob = await response.blob();
      console.log(`📊 Image size: ${blob.size} bytes`);
      return true;
    } else {
      const responseText = await response.text();
      console.log(`❌ Expected image but got: ${contentType}`);
      console.log(`📄 Response: ${responseText.substring(0, 200)}...`);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    return false;
  }
}

async function testThroughNextAPI() {
  console.log('\n🔄 Testing through Next.js API...');
  
  try {
    const testImage = await createTestImage();
    const testMask = await createTestImage();
    
    const formData = new FormData();
    formData.append('provider', 'iopaint');
    formData.append('image', new Blob([testImage], { type: 'image/png' }), 'test.png');
    formData.append('mask', new Blob([testMask], { type: 'image/png' }), 'mask.png');
    formData.append('baseUrl', 'http://localhost:8080');
    
    const response = await fetch('http://localhost:3001/api/inpaint', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Next.js API integration working!');
      return true;
    } else {
      console.log(`❌ Next.js API error: ${result.error}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Next.js API test failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🎨 IOPaint API Test Suite');
  console.log('========================\n');
  
  // Test direct IOPaint API
  const directTest = await testIOPaintAPI();
  
  if (directTest) {
    // Test through Next.js API
    await testThroughNextAPI();
  }
  
  console.log('\n📋 Troubleshooting Tips:');
  console.log('- Make sure IOPaint is running: iopaint start --model=lama --port=8080');
  console.log('- Check IOPaint logs for detailed error messages');
  console.log('- Visit http://localhost:8080/docs for API documentation');
  console.log('- Try a different model: iopaint start --model=mat --port=8080');
  console.log('- Ensure your images are valid PNG/JPEG files');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testIOPaintAPI, testThroughNextAPI };
