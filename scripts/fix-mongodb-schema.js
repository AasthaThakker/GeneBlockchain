require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

async function main() {
    console.log("🔧 Checking and Fixing MongoDB Schema...\n");

    try {
        await mongoose.connect('mongodb://localhost:27017/genomic-data-platform');
        console.log("✅ Connected to MongoDB");

        const db = mongoose.connection.db;
        const collection = db.collection('blockchaintransactions');

        // Check current collection structure
        console.log("📋 Current collection structure:");
        
        // Get a sample document to see current schema
        const sampleDoc = await collection.findOne({});
        if (sampleDoc) {
            console.log("Available fields in existing document:");
            Object.keys(sampleDoc).forEach(key => {
                const hasLatencyField = ['submissionTime', 'confirmationTime', 'latency'].includes(key);
                console.log(`  - ${key}: ${hasLatencyField ? '✅' : '⚪'}`);
            });
        }

        // Check if documents need updating
        const docsNeedingUpdate = await collection.countDocuments({
            $or: [
                { submissionTime: { $exists: false } },
                { confirmationTime: { $exists: false } },
                { latency: { $exists: false } }
            ]
        });

        console.log(`\n📊 Documents needing schema update: ${docsNeedingUpdate}`);

        if (docsNeedingUpdate > 0) {
            console.log("\n🔧 Updating documents with missing latency fields...");
            
            // Add missing fields to existing documents
            const result = await collection.updateMany(
                {
                    $or: [
                        { submissionTime: { $exists: false } },
                        { confirmationTime: { $exists: false } },
                        { latency: { $exists: false } }
                    ]
                },
                {
                    $set: {
                        submissionTime: null,
                        confirmationTime: null,
                        latency: null
                    }
                }
            );

            console.log(`✅ Updated ${result.modifiedCount} documents`);
        }

        // Verify the update
        console.log("\n🔍 Verifying schema update...");
        const updatedDoc = await collection.findOne({
            $or: [
                { submissionTime: { $exists: true } },
                { confirmationTime: { $exists: true } },
                { latency: { $exists: true } }
            ]
        });

        if (updatedDoc) {
            console.log("✅ Schema verification - Available fields:");
            console.log(`  - submissionTime: ${updatedDoc.submissionTime !== undefined ? '✅' : '❌'}`);
            console.log(`  - confirmationTime: ${updatedDoc.confirmationTime !== undefined ? '✅' : '❌'}`);
            console.log(`  - latency: ${updatedDoc.latency !== undefined ? '✅' : '❌'}`);
        }

        // Test inserting a new document with all fields
        console.log("\n🧪 Testing new document insertion...");
        const testDoc = {
            txHash: '0xTestSchemaUpdate' + Date.now(),
            blockNumber: 999,
            blockHash: '0xTestBlockHash',
            transactionIndex: 0,
            gasUsed: '21000',
            gasPrice: '20000000000',
            gasLimit: '21000',
            effectiveGasPrice: '20000000000',
            from: '0xTestAddress',
            to: '0xTestContract',
            value: '0',
            data: '0x',
            nonce: 999,
            status: true,
            timestamp: new Date(),
            confirmations: 1,
            
            // Test latency fields
            submissionTime: new Date(),
            confirmationTime: new Date(),
            latency: 123,
            
            contractAddress: '0xTestContract',
            functionName: 'testFunction',
            functionParameters: { test: true },
            events: [],
            networkId: 'localhost'
        };

        const insertResult = await collection.insertOne(testDoc);
        console.log(`✅ Inserted test document: ${insertResult.insertedId}`);

        // Verify the new document
        const newDoc = await collection.findOne({ _id: insertResult.insertedId });
        if (newDoc) {
            console.log("📊 New document verification:");
            console.log(`  - latency: ${newDoc.latency}ms ✅`);
            console.log(`  - submissionTime: ${newDoc.submissionTime} ✅`);
            console.log(`  - confirmationTime: ${newDoc.confirmationTime} ✅`);
        }

        // Clean up test document
        await collection.deleteOne({ _id: insertResult.insertedId });
        console.log("🧹 Cleaned up test document");

    } catch (error) {
        console.error("❌ Error:", error.message);
        console.error(error.stack);
    } finally {
        await mongoose.disconnect();
        console.log("\n🔌 Disconnected from MongoDB");
    }
}

main();
