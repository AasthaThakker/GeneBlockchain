const { ethers } = require('ethers');

async function correctBlockAnalysis() {
    console.log("=== CORRECTED BLOCKCHAIN ANALYSIS ===\n");
    
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545");
    const contractAddress = "0x129B884eCb6317201AaD344A1C74dB9180cA6670";
    
    // Get current stats
    const latestBlockNumber = await provider.getBlockNumber();
    const contract = new ethers.Contract(contractAddress, [
        "function recordCount() external view returns (uint256)"
    ], provider);
    const recordCount = await contract.recordCount();
    
    console.log("Current State:");
    console.log(`  Total Blocks: ${latestBlockNumber + 1} (0-${latestBlockNumber})`);
    console.log(`  On-chain Records: ${recordCount}`);
    
    console.log("\n=== FINDING GENOMIC REGISTRATIONS ===");
    
    let genomicRegistrations = [];
    let contractDeploymentBlock = null;
    
    // Check each block for genomic registrations
    for (let blockNum = 0; blockNum <= latestBlockNumber; blockNum++) {
        try {
            const block = await provider.getBlock(blockNum, true);
            
            if (block.transactions && block.transactions.length > 0) {
                for (const tx of block.transactions) {
                    // Contract deployment (no 'to' address)
                    if (!tx.to) {
                        contractDeploymentBlock = blockNum;
                        console.log(`Block ${blockNum}: Contract deployment`);
                        continue;
                    }
                    
                    // Transaction to our contract
                    if (tx.to && tx.to.toLowerCase() === contractAddress.toLowerCase()) {
                        // Check if it's a genomic registration
                        if (tx.input && tx.input.startsWith('0x0acc207e')) { // registerGenomicData function selector
                            genomicRegistrations.push({
                                block: blockNum,
                                txHash: tx.hash,
                                from: tx.from,
                                timestamp: block.timestamp,
                                input: tx.input
                            });
                            console.log(`Block ${blockNum}: Genomic registration found!`);
                        }
                    }
                }
            }
        } catch (error) {
            // Skip blocks with errors
        }
    }
    
    console.log(`\n=== RESULTS ===`);
    console.log(`Contract deployed at block: ${contractDeploymentBlock}`);
    console.log(`Genomic registrations found: ${genomicRegistrations.length}`);
    console.log(`Expected records: ${recordCount}`);
    
    console.log(`\n=== GENOMIC REGISTRATION DETAILS ===`);
    genomicRegistrations.forEach((reg, index) => {
        console.log(`\nRegistration ${index + 1}:`);
        console.log(`  Block: ${reg.block}`);
        console.log(`  Time: ${new Date(reg.timestamp * 1000).toLocaleString()}`);
        console.log(`  Tx Hash: ${reg.txHash}`);
        console.log(`  From: ${reg.from}`);
        console.log(`  Function: registerGenomicData (0x0acc207e)`);
    });
    
    console.log(`\n=== BLOCKS vs RECORDS EXPLANATION ===`);
    console.log(`Total Blocks: ${latestBlockNumber + 1}`);
    console.log(`Breakdown:`);
    console.log(`  Block 0: Genesis block (empty)`);
    console.log(`  Block ${contractDeploymentBlock}: Contract deployment`);
    console.log(`  Blocks with registrations: ${genomicRegistrations.map(r => r.block).join(', ')}`);
    console.log(`  Other blocks: ${latestBlockNumber + 1 - 1 - 1 - genomicRegistrations.length} empty blocks`);
    
    console.log(`\n=== WHY BLOCKS > RECORDS ===`);
    console.log(`This is NORMAL blockchain behavior:`);
    console.log(`1. Blockchain networks mine blocks continuously`);
    console.log(`2. Most blocks are empty (just block rewards)`);
    console.log(`3. Only specific blocks contain your data`);
    console.log(`4. Your ${recordCount} genomic records are stored in ${genomicRegistrations.length} blocks`);
    console.log(`5. The remaining ${latestBlockNumber + 1 - genomicRegistrations.length - 2} blocks are empty`);
    
    console.log(`\n=== CONCLUSION ===`);
    if (genomicRegistrations.length === Number(recordCount)) {
        console.log(`PERFECT: Found ${genomicRegistrations.length} registrations matching record count of ${recordCount}`);
        console.log(`All genomic data is properly stored on-chain!`);
    } else {
        console.log(`WARNING: Found ${genomicRegistrations.length} registrations but record count is ${recordCount}`);
    }
}

correctBlockAnalysis().then(() => {
    process.exit(0);
}).catch(error => {
    console.error('Analysis failed:', error);
    process.exit(1);
});
