const fs = require('fs');

async function testUpload() {
  try {
    console.log('🧪 Testing IPFS upload...');
    
    // Create a test file
    const testContent = 'Hello IPFS from GeneBlockchain!';
    const testFile = 'test-upload.txt';
    fs.writeFileSync(testFile, testContent);
    
    // Read file as buffer
    const fileBuffer = fs.readFileSync(testFile);
    
    // Create form data manually
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substr(2, 16);
    
    let body = '';
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="file"; filename="${testFile}"\r\n`;
    body += `Content-Type: text/plain\r\n\r\n`;
    body += testContent;
    body += `\r\n--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="pid"\r\n\r\n`;
    body += `TEST-001`;
    body += `\r\n--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="labId"\r\n\r\n`;
    body += `LAB-TEST`;
    body += `\r\n--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="labName"\r\n\r\n`;
    body += `Test Lab`;
    body += `\r\n--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="fileType"\r\n\r\n`;
    body += `TXT`;
    body += `\r\n--${boundary}--\r\n`;
    
    const buffer = Buffer.from(body, 'utf8');
    
    console.log('📤 Sending upload request...');
    
    const response = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': buffer.length.toString()
      },
      body: buffer
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Upload successful!');
      console.log('📋 Result:', JSON.stringify(result, null, 2));
    } else {
      console.log('❌ Upload failed:', result);
    }
    
    // Clean up
    fs.unlinkSync(testFile);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testUpload();
