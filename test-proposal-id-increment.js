const http = require('http');

async function testProposalIdIncrement() {
    console.log('🧪 Testing Proposal ID Increment');
    
    try {
        // Test multiple registrations with different data
        const testData = [
            {
                name: 'Test Lab User 2',
                email: 'test2@lab.com',
                password: 'testpass123',
                role: 'LAB',
                walletAddress: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92267',
                institution: 'Test Institution 2'
            },
            {
                name: 'Test Lab User 3',
                email: 'test3@lab.com',
                password: 'testpass123',
                role: 'LAB',
                walletAddress: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92268',
                institution: 'Test Institution 3'
            },
            {
                name: 'Test Researcher 4',
                email: 'test4@research.com',
                password: 'testpass123',
                role: 'RESEARCHER',
                walletAddress: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92269',
                institution: 'Test Research Institution'
            }
        ];
        
        for (let i = 0; i < testData.length; i++) {
            const data = testData[i];
            console.log(`\n📝 Test ${i + 1}: Creating registration for ${data.name}...`);
            
            const response = await new Promise((resolve, reject) => {
                const postData = JSON.stringify(data);
                
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
                    let responseData = '';
                    res.on('data', chunk => responseData += chunk);
                    res.on('end', () => {
                        try {
                            resolve(JSON.parse(responseData));
                        } catch (e) {
                            reject(e);
                        }
                    });
                }).on('error', reject);
                
                req.write(postData);
                req.end();
            });
            
            console.log(`📋 Registration Response:`, response);
            
            if (response.success) {
                console.log(`✅ Registration successful!`);
                console.log(`🆔 Proposal ID: ${response.proposalId}`);
                console.log(`📜 Transaction Hash: ${response.txHash}`);
            } else {
                console.log(`❌ Registration failed:`, response.error);
            }
            
            // Wait a moment between requests
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        console.log('\n🎉 Proposal ID increment test completed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testProposalIdIncrement();
