require('dotenv').config();
const mongoose = require('mongoose');

async function main() {
    console.log("🔍 Verifying Latency Data Storage...\n");

    try {
        await mongoose.connect('mongodb://localhost:27017/genomic-data-platform');
        console.log("✅ Connected to MongoDB");

        const db = mongoose.connection.db;

        // Check schema
        console.log("\n📋 Checking recent transactions:");
        const recentTxs = await db.collection('blockchaintransactions')
            .find({})
            .sort({ timestamp: -1 })
            .limit(3)
            .toArray();

        recentTxs.forEach((tx, idx) => {
            console.log(`\nTransaction ${idx + 1}:`);
            console.log(`  - Hash: ${tx.txHash}`);
            console.log(`  - Timestamp: ${tx.timestamp}`);
            console.log(`  - Function: ${tx.functionName}`);
            console.log(`  - Has latency: ${tx.latency !== undefined}`);
            console.log(`  - Has submissionTime: ${tx.submissionTime !== undefined}`);
            console.log(`  - Has confirmationTime: ${tx.confirmationTime !== undefined}`);
            
            if (tx.latency !== undefined) {
                console.log(`  - Latency: ${tx.latency}ms`);
            }
        });

        // Look for any transactions with latency
        const latencyTx = await db.collection('blockchaintransactions')
            .findOne({ latency: { $exists: true } });

        if (latencyTx) {
            console.log("\n✅ Found transaction with latency data:");
            console.log(`  - Hash: ${latencyTx.txHash}`);
            console.log(`  - Latency: ${latencyTx.latency}ms`);
            console.log(`  - Submission: ${latencyTx.submissionTime}`);
            console.log(`  - Confirmation: ${latencyTx.confirmationTime}`);
        } else {
            console.log("\n❌ No transactions found with latency data");
        }

        // Test a new transaction with latency tracking
        console.log("\n🧪 Testing new transaction submission...");
        
        // This would require the blockchain to be running, so we'll just verify the schema
        const schemaInfo = await db.collection('blockchaintransactions').findOne();
        if (schemaInfo) {
            console.log("\n📊 Available fields in schema:");
            console.log(`  - latency: ${schemaInfo.latency !== undefined ? '✅' : '❌'}`);
            console.log(`  - submissionTime: ${schemaInfo.submissionTime !== undefined ? '✅' : '❌'}`);
            console.log(`  - confirmationTime: ${schemaInfo.confirmationTime !== undefined ? '✅' : '❌'}`);
        }

    } catch (error) {
        console.error("❌ Error:", error.message);
    } finally {
        await mongoose.disconnect();
        console.log("\n🔌 Disconnected from MongoDB");
    }
}

main();
