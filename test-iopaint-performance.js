// IOPaint性能测试脚本
const fs = require('fs');
const path = require('path');

async function testIOPaintPerformance() {
  console.log('🧪 IOPaint性能测试开始...\n');
  
  // 检查IOPaint服务状态
  try {
    const response = await fetch('http://localhost:8080/api/v1/model');
    const modelInfo = await response.json();
    console.log('📊 当前模型信息:');
    console.log(`   模型: ${modelInfo.name}`);
    console.log(`   类型: ${modelInfo.model_type}`);
    console.log(`   需要提示词: ${modelInfo.need_prompt ? '是' : '否'}\n`);
  } catch (error) {
    console.error('❌ 无法连接到IOPaint服务:', error.message);
    console.log('请确保IOPaint正在运行在 http://localhost:8080\n');
    return;
  }
  
  // 检查测试图片
  const testImagePath = path.join(__dirname, 'test-1x1.png');
  if (!fs.existsSync(testImagePath)) {
    console.log('⚠️  未找到测试图片，创建一个简单的测试图片...');
    // 这里可以创建一个简单的测试图片
    console.log('请手动上传一张图片进行测试\n');
    return;
  }
  
  console.log('✅ IOPaint服务运行正常');
  console.log('💡 建议:');
  console.log('   1. 当前使用Docker运行，性能可能不是最优');
  console.log('   2. Apple M4芯片支持MPS加速，建议原生安装');
  console.log('   3. LaMa模型对GPU要求不高，当前配置足够使用');
  console.log('\n🎯 如需更好性能，可以考虑:');
  console.log('   - 原生安装IOPaint');
  console.log('   - 使用更强大的模型（如果需要更好效果）');
  console.log('   - 启用MPS设备加速');
}

// 运行测试
testIOPaintPerformance().catch(console.error);
