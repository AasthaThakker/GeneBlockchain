const http = require('http');

async function testFullFlow() {
    console.log('🧪 Testing Full Registration Flow');
    
    try {
        // Step 1: Test registration
        console.log('\n📝 Step 1: Creating test registration...');
        
        const registrationData = {
            name: 'Test Lab User',
            email: 'test@lab.com',
            password: 'testpass123',
            role: 'LAB',
            walletAddress: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
            institution: 'Test Institution'
        };
        
        const regResponse = await new Promise((resolve, reject) => {
            const postData = JSON.stringify(registrationData);
            
            const req = http.request({
                hostname: 'localhost',
                port: 3000,
                path: '/api/auth/register',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(e);
                    }
                });
            }).on('error', reject);
            
            req.write(postData);
            req.end();
        });
        
        console.log('📋 Registration Response:', regResponse);
        
        if (regResponse.success) {
            console.log('✅ Registration successful!');
            console.log(`🆔 Proposal ID: ${regResponse.proposalId}`);
            console.log(`📜 Transaction Hash: ${regResponse.txHash}`);
        } else {
            console.log('❌ Registration failed:', regResponse.error);
            return;
        }
        
        // Step 2: Wait a moment for blockchain to process
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Step 3: Check blockchain explorer
        console.log('\n🔍 Step 2: Checking blockchain explorer...');
        
        const explorerResponse = await new Promise((resolve, reject) => {
            http.get('http://localhost:3000/api/blockchain-explorer', (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(e);
                    }
                });
            }).on('error', reject);
        });
        
        console.log('📊 Explorer Results:');
        console.log(`   - Total Records: ${explorerResponse.data.stats.totalRecords}`);
        console.log(`   - Blockchain Records: ${explorerResponse.data.records.length}`);
        console.log(`   - Total Proposals: ${explorerResponse.data.stats.totalProposals}`);
        console.log(`   - Blockchain Proposals: ${explorerResponse.data.proposals.length}`);
        
        // Step 4: Verify data source
        if (explorerResponse.data.records.length > 0) {
            const record = explorerResponse.data.records[0];
            console.log('\n🎯 Data Source Verification:');
            console.log(`   - Has PID: ${!!record.pid}`);
            console.log(`   - Has Timestamp: ${!!record.timestamp}`);
            console.log(`   - Has RegisteredBy: ${!!record.registeredByBy}`);
            console.log(`   - Source: ${record.timestamp ? 'BLOCKCHAIN' : 'DATABASE'}`);
        }
        
        console.log('\n🎉 Full flow test completed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testFullFlow();
