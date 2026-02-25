async function testIPFSDirect() {
  try {
    console.log('🧪 Testing direct IPFS API connection...');
    
    // Test the version endpoint first
    const versionResponse = await fetch('http://127.0.0.1:5001/api/v0/version', {
      method: 'POST'
    });
    
    console.log('📋 Version response status:', versionResponse.status);
    
    if (versionResponse.ok) {
      const versionData = await versionResponse.json();
      console.log('✅ IPFS version:', versionData);
      
      // Test file upload
      console.log('📤 Testing file upload...');
      const testData = Buffer.from('Hello IPFS World!');
      
      // Create a simple multipart form
      const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substr(2, 16);
      const formData = [
        `--${boundary}`,
        'Content-Disposition: form-data; name="file"; filename="test.txt"',
        'Content-Type: text/plain',
        '',
        testData.toString(),
        `--${boundary}--`,
        ''
      ].join('\r\n');
      
      const uploadResponse = await fetch('http://127.0.0.1:5001/api/v0/add?pin=true', {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`
        },
        body: formData
      });
      
      console.log('📋 Upload response status:', uploadResponse.status);
      
      if (uploadResponse.ok) {
        const uploadData = await uploadResponse.json();
        console.log('✅ Upload successful:', uploadData);
      } else {
        const errorText = await uploadResponse.text();
        console.log('❌ Upload failed:', errorText);
      }
      
    } else {
      const errorText = await versionResponse.text();
      console.log('❌ Version check failed:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Direct IPFS test failed:', error.message);
  }
}

testIPFSDirect();
