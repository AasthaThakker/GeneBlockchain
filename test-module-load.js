const path = require('path');

// Test if we can load the IPFS HTTP module
try {
  console.log('🧪 Testing IPFS HTTP module loading...');
  
  console.log('📁 Current directory:', __dirname);
  console.log('📁 Trying to load:', path.join(__dirname, 'lib', 'ipfs-http.js'));
  
  // Try to require the JavaScript file
  const ipfsModule = require('./lib/ipfs-http');
  console.log('✅ IPFS HTTP module loaded successfully');
  console.log('📋 Available functions:', Object.keys(ipfsModule));
  
  // Test availability
  ipfsModule.checkIPFSAvailability().then(available => {
    console.log('🔍 IPFS availability:', available);
  }).catch(err => {
    console.error('❌ Error checking IPFS availability:', err.message);
  });
  
} catch (error) {
  console.error('❌ Failed to load IPFS HTTP module:', error.message);
}
