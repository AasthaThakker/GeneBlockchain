const { ethers } = require('ethers');

async function readRawBlockchainData() {
    try {
        console.log("=== Reading Raw Blockchain Data ===\n");
        
        // Connect to Ganache
        const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545");
        const contractAddress = "0x129B884eCb6317201AaD344A1C74dB9180cA6670";
        
        // Contract ABI
        const CONTRACT_ABI = [
            "function recordCount() external view returns (uint256)",
            "function genomicRecords(uint256) external view returns (string pid, string fileHash, string fileId, address registeredBy, uint256 timestamp, bool exists)",
            "function getGenomicRecord(uint256 _index) external view returns (string pid, string fileHash, string fileId, address registeredBy, uint256 timestamp)"
        ];
        
        const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, provider);
        
        // Get basic info
        const recordCount = await contract.recordCount();
        console.log(`Contract Address: ${contractAddress}`);
        console.log(`Total Records: ${recordCount}`);
        console.log(`Latest Block: ${await provider.getBlockNumber()}`);
        
        // Read all raw genomic data from blockchain
        console.log("\n=== Raw Blockchain Genomic Data ===");
        
        for (let i = 0; i < Number(recordCount); i++) {
            try {
                const record = await contract.genomicRecords(i);
                
                console.log(`\n--- Record ${i} ---`);
                console.log(`PID: ${record.pid}`);
                console.log(`File Hash: ${record.fileHash}`);
                console.log(`File ID: ${record.fileId}`);
                console.log(`Registered By: ${record.registeredBy}`);
                console.log(`Timestamp: ${new Date(Number(record.timestamp) * 1000).toISOString()}`);
                console.log(`Exists: ${record.exists}`);
                
                // Show raw bytes
                console.log(`Raw PID bytes: ${ethers.toUtf8Bytes(record.pid).toString()}`);
                console.log(`Raw Hash bytes: ${ethers.getBytes(record.fileHash).toString()}`);
                
            } catch (error) {
                console.error(`Error reading record ${i}:`, error.message);
            }
        }
        
        // Show transaction details
        console.log("\n=== Recent Transactions ===");
        const latestBlock = await provider.getBlock("latest", true);
        
        if (latestBlock && latestBlock.transactions.length > 0) {
            for (const tx of latestBlock.transactions) {
                if (tx.to && tx.to.toLowerCase() === contractAddress.toLowerCase()) {
                    console.log(`\nTransaction: ${tx.hash}`);
                    console.log(`From: ${tx.from}`);
                    console.log(`Input Data: ${tx.input}`);
                    
                    // Decode function selector
                    const functionSelector = tx.input.slice(0, 10);
                    console.log(`Function Selector: ${functionSelector}`);
                    
                    // Known selectors for our contract
                    const selectors = {
                        "0x0acc207e": "registerGenomicData",
                        "0x8da5cb5b": "owner",
                        "0x5df46374": "recordCount"
                    };
                    
                    console.log(`Function: ${selectors[functionSelector] || "Unknown"}`);
                }
            }
        }
        
    } catch (error) {
        console.error('Error reading blockchain data:', error);
    }
}

readRawBlockchainData().then(() => {
    console.log('\n=== Read complete ===');
    process.exit(0);
}).catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
});
