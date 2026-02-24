#!/usr/bin/env node

const http = require('http');

function checkIPFS() {
  console.log('🔍 Checking IPFS connection...');
  
  // Try multiple endpoints
  const endpoints = [
    { path: '/api/v0/id', name: 'Peer ID' },
    { path: '/api/v0/version', name: 'Version' },
    { path: '/', name: 'Root' }
  ];
  
  let workingEndpoint = null;
  
  function checkEndpoint(endpoint) {
    return new Promise((resolve) => {
      const options = {
        hostname: '127.0.0.1',
        port: 5001,
        path: endpoint.path,
        method: 'GET',
        timeout: 2000
      };

      const req = http.request(options, (res) => {
        if (res.statusCode === 200) {
          console.log(`✅ IPFS is running!`);
          console.log(`📡 API: http://127.0.0.1:5001`);
          console.log(`🌐 Gateway: http://127.0.0.1:8080`);
          console.log(`🖥️  Web UI: http://127.0.0.1:5001/webui`);
          console.log(`\n🚀 IPFS is ready for uploads!`);
          console.log(`💡 Start your app: npm run dev`);
          workingEndpoint = endpoint;
          resolve(true);
        } else {
          console.log(`❌ ${endpoint.name} endpoint returned: ${res.statusCode}`);
          resolve(false);
        }
      });

      req.on('error', () => {
        console.log(`❌ ${endpoint.name} endpoint failed`);
        resolve(false);
      });

      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });

      req.end();
    });
  }
  
  // Check endpoints sequentially
  async function checkAll() {
    for (const endpoint of endpoints) {
      const success = await checkEndpoint(endpoint);
      if (success) break;
    }
    
    if (!workingEndpoint) {
      console.log('❌ IPFS is not responding correctly');
      console.log('💡 Try restarting IPFS:');
      console.log('   npm run ipfs:stop');
      console.log('   npm run ipfs:start');
    }
  }
  
  checkAll();
}

checkIPFS();
