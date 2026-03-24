const http = require('http');

async function testExplorerConnection() {
    console.log('🔍 Testing Blockchain Explorer Connection...');
    
    try {
        const response = await new Promise((resolve, reject) => {
            http.get('http://localhost:3000/api/blockchain-explorer', (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const parsedData = JSON.parse(data);
                        resolve({ statusCode: res.statusCode, data: parsedData });
                    } catch (e) {
                        reject(e);
                    }
                });
            }).on('error', reject);
        });
        
        console.log('✅ Explorer Response Status:', response.statusCode || 'No status');
        console.log('📊 Database Record Count:', response.data.stats?.totalRecords || 'Not found');
        console.log('🔗 Blockchain Record Count:', response.data.stats?.totalRecords || 'Not found');
        console.log('📋 Actual Records Returned:', response.data.records?.length || 0);
        console.log('📋 Actual Proposals Returned:', response.data.proposals?.length || 0);
        console.log('📋 Actual Events Returned:', response.data.events?.length || 0);
        
        // Check if data is from database or blockchain
        if (response.data.records && response.data.records.length > 0) {
            const firstRecord = response.data.records[0];
            console.log('🔍 Sample Record Source:', {
                hasBlockchainData: !!firstRecord.pid,
                hasTimestamp: !!firstRecord.timestamp,
                hasRegisteredBy: !!firstRecord.registeredByBy,
                source: firstRecord.timestamp ? 'Blockchain' : 'Database'
            });
        }
        
        // Check network connection
        console.log('🌐 Network Info:', {
            chainId: response.data.chainId,
            networkName: response.data.networkName,
            blockNumber: response.data.blockNumber
        });
        
    } catch (error) {
        console.error('❌ Explorer Connection Failed:', error.message);
    }
}

testExplorerConnection();
