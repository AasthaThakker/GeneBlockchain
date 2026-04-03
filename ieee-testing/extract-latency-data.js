require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const fs = require('fs');

async function main() {
    console.log("📊 Extracting Transaction Latency Data for IEEE Analysis...\n");

    try {
        await mongoose.connect('mongodb://localhost:27017/genomic-data-platform');
        console.log("✅ Connected to MongoDB");

        const db = mongoose.connection.db;
        const collection = db.collection('blockchaintransactions');

        // Query transactions with latency data
        console.log("🔍 Querying transactions with latency data...");
        
        const transactions = await collection.find({
            latency: { $exists: true, $ne: null }
        })
        .project({
            txHash: 1,
            latency: 1,
            blockNumber: 1,
            timestamp: 1,
            confirmations: 1
        })
        .sort({ timestamp: 1 })
        .toArray();

        console.log(`📋 Found ${transactions.length} transactions with latency data`);

        if (transactions.length === 0) {
            console.log("❌ No transactions with latency data found");
            return;
        }

        // Prepare CSV data
        const csvData = [];
        csvData.push('tx,latency,blockNumber,timestamp,confirmations');
        
        transactions.forEach((tx, index) => {
            csvData.push(`${index + 1},${tx.latency},${tx.blockNumber},${tx.timestamp},${tx.confirmations || 1}`);
        });

        // Write to CSV file
        const csvPath = './latency_data.csv';
        fs.writeFileSync(csvPath, csvData.join('\n'));
        console.log(`💾 Data exported to: ${csvPath}`);

        // Display sample data
        console.log("\n📊 Sample Data:");
        console.log("Tx\tLatency\tBlock\tTimestamp");
        transactions.slice(0, 10).forEach((tx, index) => {
            console.log(`${index + 1}\t${tx.latency}ms\t${tx.blockNumber}\t${tx.timestamp}`);
        });

        // Calculate statistics
        const latencies = transactions.map(tx => tx.latency).filter(l => l !== null && l !== undefined);
        if (latencies.length > 0) {
            latencies.sort((a, b) => a - b);
            const min = latencies[0];
            const max = latencies[latencies.length - 1];
            const mean = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
            const median = latencies[Math.floor(latencies.length / 2)];
            const p95 = latencies[Math.floor(latencies.length * 0.95)];
            const p99 = latencies[Math.floor(latencies.length * 0.99)];

            console.log("\n📈 Latency Statistics:");
            console.log(`  - Min: ${min}ms`);
            console.log(`  - Max: ${max}ms`);
            console.log(`  - Mean: ${mean}ms`);
            console.log(`  - Median: ${median}ms`);
            console.log(`  - 95th percentile: ${p95}ms`);
            console.log(`  - 99th percentile: ${p99}ms`);
        }

        // Advanced analysis data
        console.log("\n🔷 Advanced Analysis Data Available:");
        console.log("  - Latency vs Block Number correlation");
        console.log("  - Latency vs Confirmations analysis");
        console.log("  - Timestamp-based performance trends");

    } catch (error) {
        console.error("❌ Error:", error.message);
        console.error(error.stack);
    } finally {
        await mongoose.disconnect();
        console.log("\n🔌 Disconnected from MongoDB");
    }
}

main();
