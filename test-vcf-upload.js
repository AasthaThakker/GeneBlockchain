const fs = require('fs');
const path = require('path');

async function testVCFUpload() {
  try {
    console.log('🧬 Testing VCF file upload...');
    
    // Path to the VCF file
    const vcfPath = 'dbsnp-subset-GRCh38 (1).vcf';
    
    if (!fs.existsSync(vcfPath)) {
      console.log('❌ VCF file not found at:', vcfPath);
      return;
    }
    
    // Read file as buffer
    const fileBuffer = fs.readFileSync(vcfPath);
    const fileName = path.basename(vcfPath);
    
    // Create form data manually
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substr(2, 16);
    
    let body = '';
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n`;
    body += `Content-Type: application/octet-stream\r\n\r\n`;
    body += fileBuffer.toString('binary');
    body += `\r\n--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="pid"\r\n\r\n`;
    body += `PATIENT-001`;
    body += `\r\n--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="labId"\r\n\r\n`;
    body += `LAB-001`;
    body += `\r\n--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="labName"\r\n\r\n`;
    body += `Genomics Lab`;
    body += `\r\n--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="fileType"\r\n\r\n`;
    body += `VCF`;
    body += `\r\n--${boundary}--\r\n`;
    
    const buffer = Buffer.from(body, 'utf8');
    
    console.log('📤 Uploading VCF file...');
    console.log(`📁 File: ${fileName}`);
    console.log(`📏 Size: ${fileBuffer.length} bytes`);
    console.log(`📝 Body length: ${buffer.length} bytes`);
    
    // Test IPFS availability first
    try {
      const testResponse = await fetch('http://127.0.0.1:5001/api/v0/version');
      if (testResponse.ok) {
        console.log('✅ IPFS API is responding');
      } else {
        console.log('❌ IPFS API not responding');
      }
    } catch (e) {
      console.log('❌ Cannot reach IPFS API');
    }
    
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
      console.log('✅ VCF Upload successful!');
      console.log('📋 Result:', JSON.stringify(result, null, 2));
      
      if (result.data && result.data.ipfsCID) {
        console.log(`🔗 IPFS CID: ${result.data.ipfsCID}`);
        console.log(`🌐 Gateway URL: http://127.0.0.1:8080/ipfs/${result.data.ipfsCID}`);
      }
    } else {
      console.log('❌ Upload failed:', result);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testVCFUpload();
