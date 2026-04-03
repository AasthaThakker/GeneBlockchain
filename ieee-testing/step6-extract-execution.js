require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const fs = require('fs');

async function main() {
    console.log("📊 STEP 6: DATA EXTRACTION FOR EXECUTION TIME ANALYSIS");
    console.log("=" * 60);

    try {
        await mongoose.connect('mongodb://localhost:27017/genomic-data-platform');
        console.log("✅ Connected to MongoDB");

        const db = mongoose.connection.db;
        const collection = db.collection('blockchaintransactions');

        // MongoDB Query (SECTION 6)
        console.log("🔍 Querying transactions with execution time data...");
        
        const transactions = await collection.find({
            functionName: { $exists: true },
            executionTime: { $exists: true, $ne: null }
        })
        .project({
            functionName: 1,
            executionTime: 1
        })
        .sort({ timestamp: 1 })
        .toArray();

        console.log(`📋 Found ${transactions.length} transactions with execution time data`);

        if (transactions.length === 0) {
            console.log("❌ No transactions with execution time data found");
            return;
        }

        // Convert to CSV format
        const csvData = [];
        csvData.push('function,executionTime');
        
        transactions.forEach((tx) => {
            csvData.push(`${tx.functionName},${tx.executionTime}`);
        });

        // Write to CSV file
        const csvPath = './execution.csv';
        fs.writeFileSync(csvPath, csvData.join('\n'));
        console.log(`💾 Data exported to: ${csvPath}`);

        // Display sample data
        console.log("\n📊 Sample Execution Time Data:");
        console.log("Function\tExecution Time");
        transactions.slice(0, 10).forEach((tx, index) => {
            console.log(`${tx.functionName}\t${tx.executionTime}ms`);
        });

        console.log("\n✅ STEP 6 COMPLETED - Execution data ready for Python analysis");
        console.log("📁 File generated: execution.csv");

    } catch (error) {
        console.error("❌ Error:", error.message);
        console.error(error.stack);
    } finally {
        await mongoose.disconnect();
        console.log("\n🔌 Disconnected from MongoDB");
    }
}

main();
