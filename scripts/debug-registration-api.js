const { isBlockchainAvailable, getOnChainRecordCount } = require('./lib/blockchain');

async function debugRegistration() {
    try {
        console.log("=== Debug Registration API ===");
        
        // Check blockchain availability
        const available = await isBlockchainAvailable();
        console.log("Blockchain available:", available);
        
        if (available) {
            const recordCount = await getOnChainRecordCount();
            console.log("On-chain record count:", recordCount);
            
            if (recordCount === 0) {
                console.log("Blockchain is empty - all files should need re-registration");
            }
        } else {
            console.log("Blockchain not available");
        }
        
    } catch (error) {
        console.error('Debug error:', error);
    }
}

debugRegistration().then(() => {
    process.exit(0);
}).catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
});
