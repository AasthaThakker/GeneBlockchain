const { ethers } = require("ethers");

// Contract ABI (minimal version for checking)
const CONTRACT_ABI = [
    "function recordCount() external view returns (uint256)",
    "function getGenomicRecord(uint256 _index) external view returns (string pid, string fileHash, string fileId, address registeredBy, uint256 timestamp)",
    "function genomicRecords(uint256) external view returns (string pid, string fileHash, string fileId, address registeredBy, uint256 timestamp, bool exists)"
];

async function checkBlockchainData() {
    try {
        console.log("=== Blockchain Data Check ===");
        
        // Connect to Ganache
        const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545");
        const contractAddress = "0x129B884eCb6317201AaD344A1C74dB9180cA6670";
        const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, provider);
        
        console.log("Connected to contract at:", contractAddress);
        
        // Check record count
        const recordCount = await contract.recordCount();
        console.log("On-chain record count:", recordCount.toString());
        
        if (recordCount.toString() === "0") {
            console.log("No records found on blockchain!");
            return;
        }
        
        // Check each record
        console.log("\n=== Checking individual records ===");
        for (let i = 0; i < Number(recordCount); i++) {
            try {
                // First check if record exists using the mapping
                const recordData = await contract.genomicRecords(i);
                console.log(`\nRecord ${i}:`);
                console.log("  - exists:", recordData.exists);
                console.log("  - pid:", recordData.pid);
                console.log("  - fileHash:", recordData.fileHash);
                console.log("  - fileId:", recordData.fileId);
                console.log("  - registeredBy:", recordData.registeredBy);
                console.log("  - timestamp:", new Date(Number(recordData.timestamp) * 1000).toLocaleString());
                
                // Also try the getGenomicRecord function
                if (recordData.exists) {
                    const fullRecord = await contract.getGenomicRecord(i);
                    console.log("  - getGenomicRecord() successful:", {
                        pid: fullRecord[0],
                        fileHash: fullRecord[1],
                        fileId: fullRecord[2],
                        registeredBy: fullRecord[3],
                        timestamp: new Date(Number(fullRecord[4]) * 1000).toLocaleString()
                    });
                }
            } catch (error) {
                console.log(`Record ${i}: ERROR -`, error.message);
            }
        }
        
    } catch (error) {
        console.error("Failed to check blockchain data:", error);
    }
}

// Run the check
checkBlockchainData().then(() => {
    console.log("\n=== Check complete ===");
    process.exit(0);
}).catch(error => {
    console.error("Script failed:", error);
    process.exit(1);
});
