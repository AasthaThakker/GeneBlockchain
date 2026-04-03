require('dotenv').config({ path: '../.env' });
const { ethers } = require("hardhat");
const mongoose = require('mongoose');

async function main() {
    console.log("🚀 Load Testing for Transaction Latency Analysis...\n");

    // Configuration
    const NUM_TRANSACTIONS = 50; // Adjust based on your needs
    const CONCURRENT_BATCH_SIZE = 5; // Number of concurrent transactions
    
    // Connect to MongoDB
    try {
        await mongoose.connect('mongodb://localhost:27017/genomic-data-platform');
        console.log("✅ Connected to MongoDB");
    } catch (error) {
        console.error("❌ Failed to connect to MongoDB:", error.message);
        return;
    }

    // Get contract
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    if (!contractAddress) {
        console.error("❌ NEXT_PUBLIC_CONTRACT_ADDRESS not set in .env");
        return;
    }

    const [signer] = await ethers.getSigners();
    const contract = await ethers.getContractAt("GenShareRegistry", contractAddress, signer);

    console.log(`📋 Configuration:`);
    console.log(`  - Contract: ${contractAddress}`);
    console.log(`  - Signer: ${signer.address}`);
    console.log(`  - Total transactions: ${NUM_TRANSACTIONS}`);
    console.log(`  - Concurrent batch size: ${CONCURRENT_BATCH_SIZE}`);
    console.log(`  - Estimated time: ${Math.ceil(NUM_TRANSACTIONS / CONCURRENT_BATCH_SIZE) * 15}s\n`);

    // Clear existing test data (optional)
    const db = mongoose.connection.db;
    await db.collection('blockchaintransactions').deleteMany({ 
        functionName: 'registerGenomicData',
        'functionParameters.pid': { $regex: '^LOAD-TEST-' }
    });
    console.log("🧹 Cleared previous test data\n");

    // Track all latencies
    const allLatencies = [];
    const errors = [];
    let completedTx = 0;

    // Process transactions in batches
    for (let batch = 0; batch < NUM_TRANSACTIONS; batch += CONCURRENT_BATCH_SIZE) {
        const batchSize = Math.min(CONCURRENT_BATCH_SIZE, NUM_TRANSACTIONS - batch);
        console.log(`📦 Processing batch ${Math.floor(batch / CONCURRENT_BATCH_SIZE) + 1}/${Math.ceil(NUM_TRANSACTIONS / CONCURRENT_BATCH_SIZE)} (${batchSize} transactions)`);
        
        const promises = [];
        
        for (let i = 0; i < batchSize; i++) {
            const txIndex = batch + i;
            const testPid = `LOAD-TEST-${txIndex}-${Date.now()}`;
            const testHash = "0x" + txIndex.toString(16).padStart(64, '0'); // Unique hash
            const testIpfs = `QmLoadTest${txIndex}`;
            
            const promise = (async () => {
                const submissionTime = Date.now();
                
                try {
                    const tx = await contract.registerGenomicData(testPid, testHash, testIpfs);
                    const receipt = await tx.wait();
                    const confirmationTime = Date.now();
                    const latency = confirmationTime - submissionTime;
                    
                    allLatencies.push(latency);
                    completedTx++;
                    
                    // Progress indicator
                    if (completedTx % 10 === 0 || completedTx === NUM_TRANSACTIONS) {
                        console.log(`  ✅ ${completedTx}/${NUM_TRANSACTIONS} completed (${latency}ms)`);
                    }
                    
                    return { success: true, txHash: tx.hash, latency, blockNumber: receipt.blockNumber };
                } catch (error) {
                    errors.push({ error: error.message, txIndex });
                    console.log(`  ❌ Transaction ${txIndex} failed: ${error.message}`);
                    return { success: false, error: error.message };
                }
            })();
            
            promises.push(promise);
        }
        
        // Wait for batch to complete
        await Promise.all(promises);
        
        // Small delay between batches to avoid overwhelming the network
        if (batch + batchSize < NUM_TRANSACTIONS) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    // Analysis
    console.log("\n📊 LATENCY ANALYSIS RESULTS");
    console.log("=" .repeat(50));
    
    if (allLatencies.length > 0) {
        allLatencies.sort((a, b) => a - b);
        
        const min = allLatencies[0];
        const max = allLatencies[allLatencies.length - 1];
        const mean = Math.round(allLatencies.reduce((a, b) => a + b, 0) / allLatencies.length);
        const median = allLatencies[Math.floor(allLatencies.length / 2)];
        const p95 = allLatencies[Math.floor(allLatencies.length * 0.95)];
        const p99 = allLatencies[Math.floor(allLatencies.length * 0.99)];
        
        console.log(`📈 Transaction Statistics:`);
        console.log(`  - Total successful: ${allLatencies.length}/${NUM_TRANSACTIONS}`);
        console.log(`  - Success rate: ${Math.round((allLatencies.length / NUM_TRANSACTIONS) * 100)}%`);
        console.log(`  - Failed: ${errors.length}`);
        
        console.log(`\n⏱️  Latency Metrics (milliseconds):`);
        console.log(`  - Min: ${min}ms`);
        console.log(`  - Max: ${max}ms`);
        console.log(`  - Mean: ${mean}ms`);
        console.log(`  - Median: ${median}ms`);
        console.log(`  - 95th percentile: ${p95}ms`);
        console.log(`  - 99th percentile: ${p99}ms`);
        
        // Performance classification
        console.log(`\n🎯 Performance Classification:`);
        if (mean < 1000) {
            console.log(`  - Excellent (< 1s average)`);
        } else if (mean < 3000) {
            console.log(`  - Good (1-3s average)`);
        } else if (mean < 5000) {
            console.log(`  - Acceptable (3-5s average)`);
        } else {
            console.log(`  - Needs optimization (> 5s average)`);
        }
        
        // Store summary in database for future reference
        const summary = {
            testType: 'LOAD_TEST',
            timestamp: new Date(),
            totalTransactions: NUM_TRANSACTIONS,
            successfulTransactions: allLatencies.length,
            failedTransactions: errors.length,
            latencyStats: { min, max, mean, median, p95, p99 },
            networkId: 'localhost'
        };
        
        await db.collection('performance-tests').insertOne(summary);
        console.log(`\n💾 Test summary stored in database`);
        
    } else {
        console.log("❌ No successful transactions to analyze");
    }
    
    if (errors.length > 0) {
        console.log(`\n❌ Errors encountered: ${errors.length}`);
        errors.slice(0, 5).forEach((err, idx) => {
            console.log(`  ${idx + 1}. Transaction ${err.txIndex}: ${err.error}`);
        });
        if (errors.length > 5) {
            console.log(`  ... and ${errors.length - 5} more errors`);
        }
    }

    // Verify database storage
    console.log(`\n🔍 Verifying database storage...`);
    const storedCount = await db.collection('blockchaintransactions').countDocuments({
        functionName: 'registerGenomicData',
        'functionParameters.pid': { $regex: '^LOAD-TEST-' }
    });
    console.log(`✅ Found ${storedCount} transactions in database`);
    
    // Sample recent transactions
    const recentTxs = await db.collection('blockchaintransactions')
        .find({ latency: { $exists: true } })
        .sort({ timestamp: -1 })
        .limit(3)
        .toArray();
    
    console.log(`\n📋 Sample recent transactions:`);
    recentTxs.forEach((tx, idx) => {
        console.log(`  ${idx + 1}. ${tx.txHash.slice(0, 10)}... - ${tx.latency}ms - Block ${tx.blockNumber}`);
    });

    await mongoose.disconnect();
    console.log("\n🔌 Load test completed!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
