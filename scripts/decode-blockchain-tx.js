const { ethers } = require('ethers');

async function decodeBlockchainTransaction() {
    try {
        console.log("=== Decoding Blockchain Transaction Data ===\n");
        
        // The transaction input data from the blockchain
        const txInput = "0x0acc207e00000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000075049442d30303100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004039373831396362633631653935346237313337623463613764346135386334303537323334636362343363336265663836633433366238313638363331393165000000000000000000000000000000000000000000000000000000000000002346494c455f313737353834303436393232345f353643443234463032394539363131370000000000000000000000000000000000000000000000000000000000";
        
        // Contract ABI for decoding
        const CONTRACT_ABI = [
            "function registerGenomicData(string calldata _pid, string calldata _fileHash, string calldata _fileId)"
        ];
        
        // Create interface to decode
        const iface = new ethers.Interface(CONTRACT_ABI);
        
        // Decode the transaction input
        const decoded = iface.parseTransaction({ data: txInput });
        
        console.log("=== Decoded Function Call ===");
        console.log("Function:", decoded.name);
        console.log("Arguments:");
        
        decoded.args.forEach((arg, index) => {
            console.log(`  Arg ${index}: ${arg}`);
        });
        
        // Extract the specific genomic data
        const [pid, fileHash, fileId] = decoded.args;
        
        console.log("\n=== Genomic Data Stored in Blockchain ===");
        console.log("Patient ID:", pid);
        console.log("File Hash (SHA-256):", fileHash);
        console.log("File ID:", fileId);
        
        // Verify hash format
        const isSHA256 = /^[a-f0-9]{64}$/i.test(fileHash);
        console.log("Hash Format Valid:", isSHA256 ? "Yes (SHA-256)" : "No");
        
        // Show transaction details
        console.log("\n=== Transaction Details ===");
        console.log("Transaction Hash: 0x67543739f317820e70f96fd3905a3f237c8c38795a6c16aeb6d71ad0a1f28b4f");
        console.log("Block Number: 28 (0x1c)");
        console.log("From Address: 0x625eac3f346db275be3c12d57b7b46b338116a49");
        console.log("To Contract: 0x129b884ecb6317201aad344a1c74db9180ca6670");
        
    } catch (error) {
        console.error('Error decoding transaction:', error);
    }
}

decodeBlockchainTransaction().then(() => {
    console.log('\n=== Decode complete ===');
    process.exit(0);
}).catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
});
