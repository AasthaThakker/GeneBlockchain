#!/usr/bin/env node

const { checkIPFSAvailability } = require('../lib/ipfs-simple');

async function testIPFS() {
  console.log('🔍 Testing IPFS connection...');
  
  try {
    const isAvailable = await checkIPFSAvailability();
    
    if (isAvailable) {
      console.log('✅ IPFS is available and running!');
      console.log('📡 API: http://127.0.0.1:5001');
      console.log('🌐 Gateway: http://127.0.0.1:8080');
      console.log('🖥️  Web UI: http://127.0.0.1:5001/webui');
    } else {
      console.log('❌ IPFS is not available');
      console.log('💡 Make sure IPFS daemon is running:');
      console.log('   npm run ipfs:start');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testIPFS();
