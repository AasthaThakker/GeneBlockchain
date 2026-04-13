const { ethers } = require('ethers');

async function exportBlockchainData() {
    try {
        console.log("=== Exporting Blockchain Data ===\n");
        
        // Connect to Ganache
        const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545");
        const contractAddress = "0x129B884eCb6317201AaD344A1C74dB9180cA6670";
        
        // Contract ABI (minimal for export)
        const CONTRACT_ABI = [
            "function recordCount() external view returns (uint256)",
            "function getGenomicRecord(uint256 _index) external view returns (string pid, string fileHash, string fileId, address registeredBy, uint256 timestamp)",
            "function genomicRecords(uint256) external view returns (string pid, string fileHash, string fileId, address registeredBy, uint256 timestamp, bool exists)"
        ];
        
        const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, provider);
        
        // Get basic info
        const recordCount = await contract.recordCount();
        const latestBlock = await provider.getBlockNumber();
        
        console.log(`Contract Address: ${contractAddress}`);
        console.log(`Records Stored: ${recordCount}`);
        console.log(`Latest Block: ${latestBlock}`);
        
        // Export all genomic records
        const exportData = {
            metadata: {
                contractAddress,
                recordCount: Number(recordCount),
                latestBlock,
                exportDate: new Date().toISOString(),
                network: "ganache-local"
            },
            records: []
        };
        
        for (let i = 0; i < Number(recordCount); i++) {
            try {
                const record = await contract.getGenomicRecord(i);
                exportData.records.push({
                    index: i,
                    pid: record.pid,
                    fileHash: record.fileHash,
                    fileId: record.fileId,
                    registeredBy: record.registeredBy,
                    timestamp: new Date(Number(record.timestamp) * 1000).toISOString(),
                    exists: true
                });
            } catch (error) {
                console.warn(`Failed to export record ${i}:`, error.message);
            }
        }
        
        // Save to file
        const fs = require('fs');
        const filename = `blockchain-export-${Date.now()}.json`;
        fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));
        
        console.log(`\nExport saved to: ${filename}`);
        console.log(`Total records exported: ${exportData.records.length}`);
        
        // Show summary
        console.log("\n=== Export Summary ===");
        exportData.records.forEach(record => {
            console.log(`Record ${record.index}: ${record.pid} - ${record.fileHash.substring(0, 16)}...`);
        });
        
    } catch (error) {
        console.error('Export failed:', error);
    }
}

exportBlockchainData().then(() => {
    console.log('\n=== Export complete ===');
    process.exit(0);
}).catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
});
