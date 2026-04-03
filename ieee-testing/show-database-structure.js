require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

async function showDatabaseStructure() {
    console.log("🗄️  DATABASE STRUCTURE AND STORAGE LOCATION\n");
    
    try {
        await mongoose.connect('mongodb://localhost:27017/genomic-data-platform');
        console.log("✅ Connected to MongoDB");
        
        const db = mongoose.connection.db;
        
        // Show database info
        console.log("📍 DATABASE LOCATION:");
        console.log("  - Host: localhost:27017");
        console.log("  - Database: genomic-data-platform");
        console.log("  - Collection: blockchaintransactions");
        
        // Show collections
        const collections = await db.listCollections().toArray();
        console.log("\n📁 AVAILABLE COLLECTIONS:");
        collections.forEach(col => {
            console.log(`  - ${col.name} (${col.type || 'collection'})`);
        });
        
        // Show blockchaintransactions collection structure
        console.log("\n🏗️  BLOCKCHAINTRANSACTIONS COLLECTION STRUCTURE:");
        const sampleDoc = await db.collection('blockchaintransactions').findOne({});
        if (sampleDoc) {
            console.log("  Fields present:");
            Object.keys(sampleDoc).forEach(key => {
                const value = sampleDoc[key];
                const type = typeof value;
                const isLatencyField = ['submissionTime', 'confirmationTime', 'latency'].includes(key);
                console.log(`    ${isLatencyField ? '🟢' : '⚪'} ${key}: ${type} ${Array.isArray(value) ? `[${value.length} items]` : ''}`);
            });
        }
        
        // Show transaction counts
        console.log("\n📊 TRANSACTION COUNTS:");
        const totalTx = await db.collection('blockchaintransactions').countDocuments();
        const latencyTx = await db.collection('blockchaintransactions').countDocuments({
            latency: { $exists: true, $ne: null }
        });
        const ieeeTestTx = await db.collection('blockchaintransactions').countDocuments({
            'functionParameters.pid': { $regex: '^IEEE-TEST-' }
        });
        
        console.log(`  - Total transactions: ${totalTx}`);
        console.log(`  - With latency data: ${latencyTx}`);
        console.log(`  - IEEE test transactions: ${ieeeTestTx}`);
        
        // Show recent transactions
        console.log("\n🕐 RECENT TRANSACTIONS (Last 5):");
        const recentTx = await db.collection('blockchaintransactions')
            .find({})
            .sort({ timestamp: -1 })
            .limit(5)
            .toArray();
        
        recentTx.forEach((tx, i) => {
            console.log(`  ${i+1}. ${tx.txHash?.slice(0,10)}... - ${tx.latency}ms - ${tx.functionName}`);
        });
        
        // Show persistence info
        console.log("\n💾 PERSISTENCE INFORMATION:");
        console.log("  ✅ Data is stored permanently in MongoDB");
        console.log("  ✅ No need to regenerate data when restarting project");
        console.log("  ✅ Transactions persist across server restarts");
        console.log("  ✅ Latency data is stored with each transaction");
        
        // Show how to access data
        console.log("\n🔧 HOW TO ACCESS DATA:");
        console.log("  1. MongoDB Compass (GUI):");
        console.log("     - Connect to: mongodb://localhost:27017");
        console.log("     - Database: genomic-data-platform");
        console.log("     - Collection: blockchaintransactions");
        console.log("");
        console.log("  2. Command line:");
        console.log("     mongo mongodb://localhost:27017/genomic-data-platform");
        console.log("     db.blockchaintransactions.find().pretty()");
        console.log("");
        console.log("  3. Through application:");
        console.log("     - Data automatically loaded by IEEE testing scripts");
        console.log("     - Use extract-latency-data.js to export to CSV");
        
        // Show backup recommendation
        console.log("\n📋 BACKUP RECOMMENDATION:");
        console.log("  - MongoDB data persists automatically");
        console.log("  - For backup: mongodump --db genomic-data-platform");
        console.log("  - For restore: mongorestore --db genomic-data-platform");
        
    } catch (error) {
        console.error("❌ Error:", error.message);
    } finally {
        await mongoose.disconnect();
        console.log("\n🔌 Disconnected from MongoDB");
    }
}

showDatabaseStructure();
