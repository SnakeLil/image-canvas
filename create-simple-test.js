// Create a simple valid PNG for testing
const fs = require('fs');

// Create a larger test image using Canvas API (if available) or a pre-made PNG
function createTestImage() {
  // This is a simple 64x64 white PNG image (minimum size for LAMA model)
  // For now, let's create a simple solid color image programmatically

  const width = 64;
  const height = 64;
  const channels = 3; // RGB

  // Create raw RGB data (white image)
  const imageData = Buffer.alloc(width * height * channels);
  imageData.fill(255); // Fill with white

  // Convert to base64 for testing (this is a simplified approach)
  // In a real scenario, we'd use a proper PNG encoder
  return imageData;
}

// For testing, let's use a known working approach
// Create a minimal but valid PNG that's large enough
function createMinimalPNG() {
  // This creates a simple 64x64 white PNG
  // We'll use a more complex but working PNG structure

  const width = 64;
  const height = 64;

  // Create a simple bitmap data
  const pixelData = Buffer.alloc(width * height * 3); // RGB
  pixelData.fill(255); // White pixels

  return pixelData;
}

// Test with IOPaint directly
async function testWithValidPNG() {
  console.log('🧪 Testing IOPaint with valid PNG...');
  
  const imageBase64 = validPNG.toString('base64');
  const maskBase64 = validPNG.toString('base64'); // Same image as mask
  
  const requestBody = {
    image: imageBase64,
    mask: maskBase64,
    ldm_steps: 20,
    ldm_sampler: 'plms',
    hd_strategy: 'Crop'
  };
  
  try {
    const response = await fetch('http://localhost:8080/api/v1/inpaint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log(`📊 Response status: ${response.status}`);
    console.log(`📊 Content-Type: ${response.headers.get('content-type')}`);
    
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('image/')) {
        console.log('✅ IOPaint returned an image successfully!');
        const blob = await response.blob();
        console.log(`📊 Image size: ${blob.size} bytes`);
        return true;
      } else {
        const text = await response.text();
        console.log(`📄 Response: ${text}`);
      }
    } else {
      const errorText = await response.text();
      console.log(`❌ Error: ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
  }
  
  return false;
}

// Test through our Next.js API
async function testThroughNextAPI() {
  console.log('\n🔄 Testing through Next.js API...');
  
  try {
    const formData = new FormData();
    formData.append('provider', 'iopaint');
    formData.append('image', new Blob([validPNG], { type: 'image/png' }), 'test.png');
    formData.append('mask', new Blob([validPNG], { type: 'image/png' }), 'mask.png');
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
  console.log('🎨 Simple IOPaint Test with Valid PNG');
  console.log('====================================\n');
  
  // Save the PNG for inspection
  fs.writeFileSync('test-1x1.png', validPNG);
  console.log('💾 Saved test-1x1.png for inspection');
  
  const directTest = await testWithValidPNG();
  
  if (directTest) {
    await testThroughNextAPI();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testWithValidPNG, testThroughNextAPI };
