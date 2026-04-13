const { ethers } = require('ethers');

async function dumpRawBlockchain() {
    try {
        console.log("=== Complete Raw Blockchain Data Dump ===\n");
        
        const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545");
        const contractAddress = "0x129B884eCb6317201AaD344A1C74dB9180cA6670";
        
        // Get all blocks
        const latestBlockNumber = await provider.getBlockNumber();
        console.log(`Total Blocks: ${latestBlockNumber + 1}`);
        
        // Get all transactions related to our contract
        const allContractTxs = [];
        
        for (let blockNum = 0; blockNum <= latestBlockNumber; blockNum++) {
            const block = await provider.getBlock(blockNum, true);
            
            if (block && block.transactions) {
                for (const tx of block.transactions) {
                    if (tx.to && tx.to.toLowerCase() === contractAddress.toLowerCase()) {
                        const receipt = await provider.getTransactionReceipt(tx.hash);
                        
                        allContractTxs.push({
                            hash: tx.hash,
                            blockNumber: blockNum,
                            from: tx.from,
                            to: tx.to,
                            input: tx.input,
                            gasUsed: receipt.gasUsed.toString(),
                            gasPrice: tx.gasPrice?.toString() || '0',
                            timestamp: new Date(block.timestamp * 1000).toISOString(),
                            logs: receipt.logs.map(log => ({
                                address: log.address,
                                topics: log.topics,
                                data: log.data
                            }))
                        });
                    }
                }
            }
        }
        
        console.log(`\nFound ${allContractTxs.length} contract transactions:\n`);
        
        allContractTxs.forEach((tx, index) => {
            console.log(`=== Transaction ${index + 1} ===`);
            console.log(`Hash: ${tx.hash}`);
            console.log(`Block: ${tx.blockNumber}`);
            console.log(`From: ${tx.from}`);
            console.log(`To: ${tx.to}`);
            console.log(`Timestamp: ${tx.timestamp}`);
            console.log(`Gas Used: ${tx.gasUsed}`);
            console.log(`Gas Price: ${tx.gasPrice} wei`);
            console.log(`Input Data: ${tx.input}`);
            
            // Decode input if it's a function call
            if (tx.input.startsWith('0x0acc207e')) {
                console.log(`Function: registerGenomicData`);
                
                // Extract parameters from input data
                const data = tx.input.slice(10); // Remove function selector
                
                // Parse the parameters (simplified)
                const pidOffset = parseInt(data.slice(0, 64), 16);
                const hashOffset = parseInt(data.slice(64, 128), 16);
                const fileIdOffset = parseInt(data.slice(128, 192), 16);
                
                console.log(`Parameter Offsets - PID: ${pidOffset}, Hash: ${hashOffset}, FileID: ${fileIdOffset}`);
            }
            
            console.log(`Logs: ${tx.logs.length}`);
            tx.logs.forEach((log, logIndex) => {
                console.log(`  Log ${logIndex}: ${log.topics[0]} - ${log.data}`);
            });
            
            console.log('');
        });
        
        // Export to file
        const fs = require('fs');
        const exportData = {
            metadata: {
                contractAddress,
                totalBlocks: latestBlockNumber + 1,
                contractTransactions: allContractTxs.length,
                exportDate: new Date().toISOString()
            },
            transactions: allContractTxs
        };
        
        const filename = `raw-blockchain-dump-${Date.now()}.json`;
        fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));
        
        console.log(`\nComplete dump saved to: ${filename}`);
        
    } catch (error) {
        console.error('Error dumping blockchain:', error);
    }
}

dumpRawBlockchain().then(() => {
    console.log('\n=== Dump complete ===');
    process.exit(0);
}).catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
});
