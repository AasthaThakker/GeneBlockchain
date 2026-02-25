const fs = require('fs');
const http = require('http');

async function testVCFUploadSimple() {
  try {
    console.log('🧪 Testing VCF file upload to IPFS (simple)...');
    
    // Read the test VCF file
    const vcfContent = fs.readFileSync('./test-sample.vcf');
    console.log(`📁 VCF file size: ${vcfContent.length} bytes`);
    
    // Create multipart form data manually
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substr(2, 16);
    
    let formData = '';
    
    // Add file
    formData += `--${boundary}\r\n`;
    formData += `Content-Disposition: form-data; name="file"; filename="test-sample.vcf"\r\n`;
    formData += `Content-Type: text/plain\r\n\r\n`;
    formData += vcfContent.toString('utf8') + '\r\n';
    
    // Add other fields
    formData += `--${boundary}\r\n`;
    formData += `Content-Disposition: form-data; name="pid"\r\n\r\n`;
    formData += `TEST-001\r\n`;
    
    formData += `--${boundary}\r\n`;
    formData += `Content-Disposition: form-data; name="labId"\r\n\r\n`;
    formData += `LAB-TEST\r\n`;
    
    formData += `--${boundary}\r\n`;
    formData += `Content-Disposition: form-data; name="labName"\r\n\r\n`;
    formData += `Test Lab\r\n`;
    
    formData += `--${boundary}\r\n`;
    formData += `Content-Disposition: form-data; name="fileType"\r\n\r\n`;
    formData += `VCF\r\n`;
    
    formData += `--${boundary}--\r\n`;
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/upload',
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': Buffer.byteLength(formData)
      }
    };
    
    console.log('📤 Uploading to IPFS via HTTP API...');
    
    const response = await new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        });
      });
      
      req.on('error', reject);
      req.write(formData);
      req.end();
    });
    
    console.log('📋 Response status:', response.statusCode);
    console.log('📋 Response body:', response.body);
    
    if (response.statusCode === 200) {
      const result = JSON.parse(response.body);
      console.log('✅ Upload successful!');
      console.log('📋 Upload result:', JSON.stringify(result, null, 2));
    } else {
      console.log('❌ Upload failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testVCFUploadSimple();
