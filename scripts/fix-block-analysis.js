const { ethers } = require('ethers');

async function fixBlockAnalysis() {
    console.log("=== CORRECTED BLOCKCHAIN ACTIVITY ANALYSIS ===\n");
    
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545");
    const contractAddress = "0x129B884eCb6317201AaD344A1C74dB9180cA6670";
    
    // Get current stats
    const latestBlockNumber = await provider.getBlockNumber();
    
    console.log("Current State:");
    console.log(`  Total Blocks: ${latestBlockNumber + 1} (0-${latestBlockNumber})`);
    
    console.log("\n=== DETAILED BLOCK ANALYSIS ===");
    
    let genomicRegistrationBlocks = [];
    let contractDeploymentBlocks = [];
    let otherTransactions = [];
    let emptyBlocks = [];
    
    // Analyze each block
    for (let blockNum = 0; blockNum <= latestBlockNumber; blockNum++) {
        try {
            const block = await provider.getBlock(blockNum, true);
            let blockType = "EMPTY";
            let txCount = 0;
            
            if (block.transactions && block.transactions.length > 0) {
                txCount = block.transactions.length;
                
                for (const tx of block.transactions) {
                    // Contract deployment (no 'to' address)
                    if (!tx.to) {
                        blockType = "CONTRACT_DEPLOY";
                        contractDeploymentBlocks.push(blockNum);
                        break;
                    }
                    
                    // Transaction to our contract
                    if (tx.to && tx.to.toLowerCase() === contractAddress.toLowerCase()) {
                        // Check if it's a genomic registration
                        if (tx.input.startsWith('0x0acc207e')) { // registerGenomicData function selector
                            blockType = "GENOMIC_REGISTRATION";
                            genomicRegistrationBlocks.push(blockNum);
                            break;
                        } else {
                            blockType = "CONTRACT_CALL";
                            otherTransactions.push(blockNum);
                            break;
                        }
                    } else {
                        blockType = "OTHER_TRANSACTION";
                        otherTransactions.push(blockNum);
                    }
                }
            } else {
                emptyBlocks.push(blockNum);
            }
            
            console.log(`Block ${blockNum.toString().padStart(2, '0')}: ${blockType} | Txs: ${txCount} | Time: ${new Date(block.timestamp * 1000).toLocaleString()}`);
            
        } catch (error) {
            console.log(`Block ${blockNum.toString().padStart(2, '0')}: ERROR - ${error.message}`);
        }
    }
    
    console.log("\n=== SUMMARY ===");
    console.log(`Contract Deployment Blocks: ${contractDeploymentBlocks.join(', ')}`);
    console.log(`Genomic Registration Blocks: ${genomicRegistrationBlocks.join(', ')}`);
    console.log(`Other Contract Call Blocks: ${otherTransactions.join(', ')}`);
    console.log(`Empty Blocks: ${emptyBlocks.length} blocks`);
    
    // Show genomic registration details
    console.log(`\n=== GENOMIC REGISTRATIONS (${genomicRegistrationBlocks.length}) ===`);
    for (let i = 0; i < genomicRegistrationBlocks.length; i++) {
        const blockNum = genomicRegistrationBlocks[i];
        const block = await provider.getBlock(blockNum, true);
        
        console.log(`\nRegistration ${i+1} (Block ${blockNum}):`);
        console.log(`  Time: ${new Date(block.timestamp * 1000).toLocaleString()}`);
        
        for (const tx of block.transactions) {
            if (tx.to && tx.to.toLowerCase() === contractAddress.toLowerCase()) {
                console.log(`  Tx Hash: ${tx.hash}`);
                console.log(`  From: ${tx.from}`);
                console.log(`  Gas: ${ethers.formatUnits(tx.gas, "wei")} wei`);
            }
        }
    }
    
    // Show contract deployment details
    if (contractDeploymentBlocks.length > 0) {
        console.log(`\n=== CONTRACT DEPLOYMENT ===`);
        const deployBlock = contractDeploymentBlocks[contractDeploymentBlocks.length - 1]; // Latest deployment
        console.log(`Contract deployed at block ${deployBlock}`);
        console.log(`Contract address: ${contractAddress}`);
    }
    
    console.log("\n=== EXPLANATION: BLOCKS vs RECORDS ===");
    console.log(`Total Blocks: ${latestBlockNumber + 1}`);
    console.log(`Genomic Records: ${genomicRegistrationBlocks.length}`);
    console.log(`Empty Blocks: ${emptyBlocks.length}`);
    console.log(`Contract Deployments: ${contractDeploymentBlocks.length}`);
    console.log(`Other Transactions: ${otherTransactions.length}`);
    
    console.log("\nThis is NORMAL because:");
    console.log("1. Block 0: Genesis block (always empty)");
    console.log(`2. Block ${contractDeploymentBlocks.join(', ')}: Contract deployment(s)`);
    console.log(`3. Blocks ${genomicRegistrationBlocks.join(', ')}: Your ${genomicRegistrationBlocks.length} genomic registrations`);
    console.log(`4. ${emptyBlocks.length} other blocks: Empty blocks (mined without transactions)`);
    console.log("\nBlockchain networks continuously mine blocks, even when there are no transactions!");
}

fixBlockAnalysis().then(() => {
    process.exit(0);
}).catch(error => {
    console.error('Analysis failed:', error);
    process.exit(1);
});
