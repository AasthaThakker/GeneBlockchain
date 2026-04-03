require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

async function main() {
    console.log("🔍 VERIFYING DATABASE HAS LATENCY VALUES...\n");

    try {
        await mongoose.connect('mongodb://localhost:27017/genomic-data-platform');
        console.log("✅ Connected to MongoDB");

        const db = mongoose.connection.db;
        const collection = db.collection('blockchaintransactions');

        // Count total transactions
        const totalTx = await collection.countDocuments();
        console.log(`📊 Total transactions in database: ${totalTx}`);

        // Count transactions with latency data
        const latencyTx = await collection.countDocuments({
            latency: { $exists: true, $ne: null }
        });
        console.log(`📈 Transactions with latency data: ${latencyTx}`);

        // Count transactions with all required fields
        const completeTx = await collection.countDocuments({
            submissionTime: { $exists: true },
            confirmationTime: { $exists: true },
            latency: { $exists: true }
        });
        console.log(`✅ Transactions with all latency fields: ${completeTx}`);

        // Verify recent IEEE test transactions
        const ieeeTestTx = await collection.countDocuments({
            'functionParameters.pid': { $regex: '^IEEE-TEST-' }
        });
        console.log(`🧪 IEEE test transactions: ${ieeeTestTx}`);

        // Sample verification
        console.log("\n🔍 SAMPLE VERIFICATION:");
        const sampleTx = await collection.find({
            'functionParameters.pid': { $regex: '^IEEE-TEST-' }
        })
        .limit(3)
        .toArray();

        sampleTx.forEach((tx, index) => {
            console.log(`\nSample ${index + 1}:`);
            console.log(`  - Hash: ${tx.txHash.slice(0, 10)}...`);
            console.log(`  - PID: ${tx.functionParameters?.pid}`);
            console.log(`  - Block: ${tx.blockNumber}`);
            console.log(`  - Latency: ${tx.latency}ms`);
            console.log(`  - Submission: ${tx.submissionTime ? '✅' : '❌'}`);
            console.log(`  - Confirmation: ${tx.confirmationTime ? '✅' : '❌'}`);
            console.log(`  - All fields: ${tx.latency && tx.submissionTime && tx.confirmationTime ? '✅' : '❌'}`);
        });

        // Statistics for IEEE test data
        const ieeeStats = await collection.aggregate([
            { $match: { 'functionParameters.pid': { $regex: '^IEEE-TEST-' } } },
            { $group: {
                _id: null,
                count: { $sum: 1 },
                minLatency: { $min: '$latency' },
                maxLatency: { $max: '$latency' },
                avgLatency: { $avg: '$latency' },
                medianLatency: { $percentile: { input: '$latency', p: [0.5], method: 'approximate' } }
            }}
        ]).toArray();

        if (ieeeStats.length > 0) {
            const stats = ieeeStats[0];
            console.log(`\n📈 IEEE TEST DATA STATISTICS:`);
            console.log(`  - Count: ${stats.count}`);
            console.log(`  - Min Latency: ${stats.minLatency}ms`);
            console.log(`  - Max Latency: ${stats.maxLatency}ms`);
            console.log(`  - Avg Latency: ${Math.round(stats.avgLatency)}ms`);
            console.log(`  - Median Latency: ${Math.round(stats.medianLatency[0])}ms`);
        }

        // Final verification status
        console.log(`\n🎯 VERIFICATION STATUS:`);
        
        const hasSubmissionTime = await collection.countDocuments({
            submissionTime: { $exists: true }
        }) > 0;
        
        const hasConfirmationTime = await collection.countDocuments({
            confirmationTime: { $exists: true }
        }) > 0;
        
        const hasLatency = await collection.countDocuments({
            latency: { $exists: true, $ne: null }
        }) > 0;

        console.log(`  ✅ Add submissionTime: ${hasSubmissionTime ? 'IMPLEMENTED' : 'MISSING'}`);
        console.log(`  ✅ Add confirmationTime: ${hasConfirmationTime ? 'IMPLEMENTED' : 'MISSING'}`);
        console.log(`  ✅ Store latency: ${hasLatency ? 'IMPLEMENTED' : 'MISSING'}`);
        console.log(`  ✅ Execute 100+ transactions: ${ieeeTestTx >= 100 ? 'COMPLETED' : `PARTIAL (${ieeeTestTx})`}`);
        console.log(`  ✅ DB has latency values: ${latencyTx > 0 ? 'VERIFIED' : 'NOT FOUND'}`);

        // Overall status
        const allChecksPass = hasSubmissionTime && hasConfirmationTime && hasLatency && ieeeTestTx >= 100;
        console.log(`\n🏁 OVERALL STATUS: ${allChecksPass ? '✅ ALL TASKS COMPLETED' : '❌ SOME TASKS INCOMPLETE'}`);

    } catch (error) {
        console.error("❌ Error:", error.message);
        console.error(error.stack);
    } finally {
        await mongoose.disconnect();
        console.log("\n🔌 Disconnected from MongoDB");
    }
}

main();
