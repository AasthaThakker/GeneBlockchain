const fs = require('fs');
const FormData = require('form-data');

async function testVCFUpload() {
  try {
    console.log('🧪 Testing VCF file upload to IPFS...');
    
    // Read the test VCF file
    const vcfContent = fs.readFileSync('./test-sample.vcf');
    console.log(`📁 VCF file size: ${vcfContent.length} bytes`);
    
    // Create form data for upload
    const form = new FormData();
    form.append('file', vcfContent, 'test-sample.vcf');
    form.append('pid', 'TEST-001');
    form.append('labId', 'LAB-TEST');
    form.append('labName', 'Test Lab');
    form.append('fileType', 'VCF');
    
    console.log('📤 Uploading to IPFS via HTTP API...');
    console.log('📋 Form headers:', form.getHeaders());
    
    // Upload via API
    const response = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Upload failed: ${response.status} - ${error}`);
    }
    
    const result = await response.json();
    console.log('✅ Upload successful!');
    console.log('📋 Upload result:', JSON.stringify(result, null, 2));
    
    // Test download
    if (result.data && result.data.ipfsCID) {
      console.log('📥 Testing download...');
      const downloadResponse = await fetch(`http://localhost:3000/api/upload?cid=${result.data.ipfsCID}&decrypt=true`);
      
      if (downloadResponse.ok) {
        const downloadedContent = await downloadResponse.text();
        console.log('✅ Download successful!');
        console.log(`📄 Downloaded content length: ${downloadedContent.length} characters`);
        console.log('🔍 Content preview:', downloadedContent.substring(0, 200) + '...');
      } else {
        console.log('❌ Download failed:', downloadResponse.status);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testVCFUpload();
