require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const fs = require('fs');

async function main() {
    console.log("⛽ EXTRACTING GAS COST DATA FOR IEEE ANALYSIS...\n");

    try {
        await mongoose.connect('mongodb://localhost:27017/genomic-data-platform');
        console.log("✅ Connected to MongoDB");

        const db = mongoose.connection.db;
        const collection = db.collection('blockchaintransactions');

        // Query transactions with gas and operation type data
        console.log("🔍 Querying transactions with gas data...");
        
        const transactions = await collection.find({
            operationType: { $exists: true },
            gasUsed: { $exists: true, $ne: null }
        })
        .project({
            txHash: 1,
            operationType: 1,
            gasUsed: 1,
            gasPrice: 1,
            gasCostETH: 1,
            functionName: 1,
            blockNumber: 1,
            timestamp: 1,
            latency: 1
        })
        .sort({ timestamp: 1 })
        .toArray();

        console.log(`📋 Found ${transactions.length} transactions with gas data`);

        if (transactions.length === 0) {
            console.log("❌ No transactions with gas data found");
            return;
        }

        // Prepare CSV data for IEEE analysis
        const csvData = [];
        csvData.push('tx,operationType,gasUsed,gasPrice,gasCostETH,functionName,latency');
        
        transactions.forEach((tx, index) => {
            csvData.push(`${index + 1},${tx.operationType},${tx.gasUsed},${tx.gasPrice},${tx.gasCostETH},${tx.functionName},${tx.latency || 0}`);
        });

        // Write to CSV file
        const csvPath = './gas_cost_data.csv';
        fs.writeFileSync(csvPath, csvData.join('\n'));
        console.log(`💾 Gas data exported to: ${csvPath}`);

        // Display sample data
        console.log("\n📊 Sample Gas Data:");
        console.log("Tx\tOperation\tGas Used\tCost (ETH)\tFunction");
        transactions.slice(0, 10).forEach((tx, index) => {
            console.log(`${index + 1}\t${tx.operationType}\t${Number(tx.gasUsed).toLocaleString()}\t${tx.gasCostETH}\t${tx.functionName}`);
        });

        // Calculate statistics by operation type
        const statsByOperation = {};
        transactions.forEach(tx => {
            if (!statsByOperation[tx.operationType]) {
                statsByOperation[tx.operationType] = {
                    count: 0,
                    gasUsed: [],
                    gasCostETH: [],
                    latencies: []
                };
            }
            statsByOperation[tx.operationType].count++;
            statsByOperation[tx.operationType].gasUsed.push(Number(tx.gasUsed));
            statsByOperation[tx.operationType].gasCostETH.push(Number(tx.gasCostETH));
            if (tx.latency) {
                statsByOperation[tx.operationType].latencies.push(tx.latency);
            }
        });

        console.log("\n📈 Gas Cost Statistics by Operation Type:");
        Object.entries(statsByOperation).forEach(([operation, stats]) => {
            const avgGas = Math.round(stats.gasUsed.reduce((a, b) => a + b, 0) / stats.gasUsed.length);
            const minGas = Math.min(...stats.gasUsed);
            const maxGas = Math.max(...stats.gasUsed);
            const avgCost = (stats.gasCostETH.reduce((a, b) => a + b, 0) / stats.gasCostETH.length);
            const totalCost = stats.gasCostETH.reduce((a, b) => a + b, 0);
            
            console.log(`\n${operation}:`);
            console.log(`  - Count: ${stats.count}`);
            console.log(`  - Avg Gas: ${avgGas.toLocaleString()}`);
            console.log(`  - Gas Range: ${minGas.toLocaleString()} - ${maxGas.toLocaleString()}`);
            console.log(`  - Avg Cost: ${avgCost.toFixed(8)} ETH`);
            console.log(`  - Total Cost: ${totalCost.toFixed(8)} ETH`);
            
            if (stats.latencies.length > 0) {
                const avgLatency = Math.round(stats.latencies.reduce((a, b) => a + b, 0) / stats.latencies.length);
                console.log(`  - Avg Latency: ${avgLatency}ms`);
            }
        });

        // Overall statistics
        const allGasUsed = transactions.map(tx => Number(tx.gasUsed));
        const allCostETH = transactions.map(tx => Number(tx.gasCostETH));
        
        console.log(`\n🎯 OVERALL GAS ANALYSIS:`);
        console.log(`  - Total Transactions: ${transactions.length}`);
        console.log(`  - Total Gas Used: ${allGasUsed.reduce((a, b) => a + b, 0).toLocaleString()}`);
        console.log(`  - Average Gas: ${Math.round(allGasUsed.reduce((a, b) => a + b, 0) / allGasUsed.length).toLocaleString()}`);
        console.log(`  - Total Cost: ${allCostETH.reduce((a, b) => a + b, 0).toFixed(8)} ETH`);
        console.log(`  - Average Cost: ${(allCostETH.reduce((a, b) => a + b, 0) / allCostETH.length).toFixed(8)} ETH`);
        console.log(`  - Gas Range: ${Math.min(...allGasUsed).toLocaleString()} - ${Math.max(...allGasUsed).toLocaleString()}`);

        // IEEE Analysis insights
        console.log(`\n🔷 IEEE ANALYSIS INSIGHTS:`);
        console.log(`  ✅ Standardized operation types implemented`);
        console.log(`  ✅ Gas cost calculation in ETH available`);
        console.log(`  ✅ Operation-specific gas analysis ready`);
        console.log(`  ✅ Gas vs latency correlation data available`);
        console.log(`  ✅ Comprehensive dataset for IEEE graphs`);

    } catch (error) {
        console.error("❌ Error:", error.message);
        console.error(error.stack);
    } finally {
        await mongoose.disconnect();
        console.log("\n🔌 Disconnected from MongoDB");
    }
}

main();
