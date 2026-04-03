require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

// Import our latency-tracking function
const { registerGenomicData } = require('../lib/blockchain-storage-final');

async function main() {
    console.log("🚀 EXECUTING 100+ TRANSACTIONS FOR IEEE ANALYSIS...\n");

    // Configuration
    const NUM_TRANSACTIONS = 120; // More than 100 as required
    const CONCURRENT_BATCH_SIZE = 8; // Increased for faster execution
    
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb://localhost:27017/genomic-data-platform');
        console.log("✅ Connected to MongoDB");

        console.log(`📋 Configuration:`);
        console.log(`  - Total transactions: ${NUM_TRANSACTIONS}`);
        console.log(`  - Concurrent batch size: ${CONCURRENT_BATCH_SIZE}`);
        console.log(`  - Using latency-tracking registerGenomicData function\n`);

        const db = mongoose.connection.db;
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
                const testPid = `IEEE-TEST-${txIndex}-${Date.now()}`;
                const testHash = "0x" + txIndex.toString(16).padStart(64, '0');
                const testIpfs = `QmIeeeTest${txIndex}`;
                
                const promise = (async () => {
                    try {
                        // Use our latency-tracking function
                        const result = await registerGenomicData(testPid, testHash, testIpfs);
                        
                        if (result.latency) {
                            allLatencies.push(result.latency);
                            completedTx++;
                            
                            // Progress indicator
                            if (completedTx % 20 === 0 || completedTx === NUM_TRANSACTIONS) {
                                console.log(`  ✅ ${completedTx}/${NUM_TRANSACTIONS} completed (${result.latency}ms)`);
                            }
                            
                            return { success: true, txHash: result.txHash, latency: result.latency };
                        } else {
                            console.log(`  ⚠️  Transaction completed but no latency data`);
                            return { success: false, error: 'No latency data' };
                        }
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
            
            // Small delay between batches
            if (batch + batchSize < NUM_TRANSACTIONS) {
                await new Promise(resolve => setTimeout(resolve, 1500));
            }
        }

        // Analysis
        console.log("\n📊 TRANSACTION EXECUTION RESULTS");
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
            if (mean < 10) {
                console.log(`  - Excellent (< 10ms average)`);
            } else if (mean < 30) {
                console.log(`  - Good (10-30ms average)`);
            } else if (mean < 100) {
                console.log(`  - Acceptable (30-100ms average)`);
            } else {
                console.log(`  - Needs optimization (> 100ms average)`);
            }
            
            // Store summary for reference
            const summary = {
                testType: 'IEEE_PREPARATION',
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
            errors.slice(0, 3).forEach((err, idx) => {
                console.log(`  ${idx + 1}. Transaction ${err.txIndex}: ${err.error}`);
            });
            if (errors.length > 3) {
                console.log(`  ... and ${errors.length - 3} more errors`);
            }
        }

    } catch (error) {
        console.error("❌ Error:", error.message);
        console.error(error.stack);
    } finally {
        await mongoose.disconnect();
        console.log("\n🔌 Disconnected from MongoDB");
    }
}

main();
