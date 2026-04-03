require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const fs = require('fs');

async function main() {
    console.log("📊 STEP 4: DATA EXTRACTION FOR BLOCK TIME ANALYSIS");
    console.log("=" * 60);

    try {
        await mongoose.connect('mongodb://localhost:27017/genomic-data-platform');
        console.log("✅ Connected to MongoDB");

        const db = mongoose.connection.db;
        const collection = db.collection('blocks');

        // MongoDB Query (SECTION 4)
        console.log("🔍 Querying blocks with timestamp and load...");
        
        const blocks = await collection.find({
            load: { $exists: true, $ne: null }
        })
        .project({
            blockNumber: 1,
            timestamp: 1,
            load: 1
        })
        .sort({ blockNumber: 1 })
        .toArray();

        console.log(`📋 Found ${blocks.length} blocks with load data`);

        if (blocks.length === 0) {
            console.log("❌ No blocks with load data found");
            return;
        }

        // Convert to CSV format
        const csvData = [];
        csvData.push('blockNumber,timestamp,load');
        
        blocks.forEach((block) => {
            csvData.push(`${block.blockNumber},${block.timestamp},${block.load}`);
        });

        // Write to CSV file
        const csvPath = './blocks.csv';
        fs.writeFileSync(csvPath, csvData.join('\n'));
        console.log(`💾 Data exported to: ${csvPath}`);

        // Display sample data
        console.log("\n📊 Sample Block Data:");
        console.log("Block#\tTimestamp\t\t\tLoad");
        blocks.slice(0, 5).forEach((block, index) => {
            console.log(`${block.blockNumber}\t${block.timestamp}\t${block.load}`);
        });

        // Display load distribution
        const loadDistribution = {};
        blocks.forEach(block => {
            if (!loadDistribution[block.load]) {
                loadDistribution[block.load] = 0;
            }
            loadDistribution[block.load]++;
        });

        console.log("\n📈 Load Distribution in Blocks:");
        Object.entries(loadDistribution).forEach(([load, count]) => {
            console.log(`  Load ${load}: ${count} blocks`);
        });

        console.log("\n✅ STEP 4 COMPLETED - Block data ready for Python analysis");
        console.log("📁 File generated: blocks.csv");

    } catch (error) {
        console.error("❌ Error:", error.message);
        console.error(error.stack);
    } finally {
        await mongoose.disconnect();
        console.log("\n🔌 Disconnected from MongoDB");
    }
}

main();
