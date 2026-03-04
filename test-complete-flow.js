const fs = require('fs');

async function testCompleteFlow() {
    console.log('🧪 Testing Complete Upload + Blockchain Registration Flow');
    
    try {
        // Simulate file upload
        const testFile = {
            name: 'test-genomic-file.vcf',
            size: 1024,
            arrayBuffer: async () => Buffer.from('test genomic data content')
        };
        
        const formData = new FormData();
        formData.append('file', testFile, 'test-genomic-file.vcf');
        formData.append('pid', 'TEST_PATIENT_001');
        formData.append('fileHash', 'test_hash_12345');
        formData.append('labId', 'TEST_LAB_001');
        formData.append('labName', 'Test Lab');
        formData.append('fileType', 'genomic');
        
        console.log('📤 Step 1: Uploading to IPFS...');
        
        // Test upload to IPFS
        const uploadResponse = await fetch('http://localhost:3000/api/upload', {
            method: 'POST',
            body: formData
        });
        
        if (!uploadResponse.ok) {
            throw new Error(`Upload failed: ${await uploadResponse.text()}`);
        }
        
        const uploadResult = await uploadResponse.json();
        console.log('✅ IPFS Upload successful:', uploadResult.data.ipfsCID);
        
        // Wait a moment for blockchain processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if blockchain transaction was stored
        console.log('🔍 Step 2: Checking blockchain storage...');
        
        const txResponse = await fetch(`http://localhost:3000/api/blockchain/transactions?hash=${uploadResult.data.txHash}`);
        
        if (!txResponse.ok) {
            throw new Error(`Transaction lookup failed: ${await txResponse.text()}`);
        }
        
        const txData = await txResponse.json();
        console.log('✅ Blockchain transaction stored:', txData.data.txHash);
        console.log('📊 Block Number:', txData.data.blockNumber);
        console.log('⛽ Gas Used:', txData.data.gasUsed);
        
        // Check blockchain statistics
        console.log('📈 Step 3: Checking blockchain statistics...');
        
        const statsResponse = await fetch('http://localhost:3000/api/blockchain/transactions?stats=true');
        
        if (!statsResponse.ok) {
            throw new Error(`Stats lookup failed: ${await statsResponse.text()}`);
        }
        
        const stats = await statsResponse.json();
        console.log('✅ Blockchain Stats:', {
            totalTransactions: stats.data.totalTransactions,
            totalBlocks: stats.data.totalBlocks,
            successRate: stats.data.successRate.toFixed(2) + '%'
        });
        
        console.log('🎉 Complete flow test successful!');
        
    } catch (error) {
        console.error('❌ Flow test failed:', error.message);
    }
}

testCompleteFlow();
