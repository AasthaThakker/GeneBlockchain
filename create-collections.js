const mongoose = require('mongoose');

async function createCollections() {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb://localhost:27017/genomic-data-platform');
        console.log('✅ Connected to MongoDB');
        
        const db = mongoose.connection.db;
        
        // Create blockchaintransactions collection
        console.log('\n🔧 Creating blockchaintransactions collection...');
        await db.createCollection('blockchaintransactions');
        
        // Create indexes for blockchaintransactions
        await db.collection('blockchaintransactions').createIndex({ txHash: 1 }, { unique: true });
        await db.collection('blockchaintransactions').createIndex({ blockNumber: -1 });
        await db.collection('blockchaintransactions').createIndex({ timestamp: -1 });
        await db.collection('blockchaintransactions').createIndex({ from: 1, timestamp: -1 });
        await db.collection('blockchaintransactions').createIndex({ to: 1, timestamp: -1 });
        await db.collection('blockchaintransactions').createIndex({ 'events.name': 1 });
        await db.collection('blockchaintransactions').createIndex({ functionName: 1 });
        await db.collection('blockchaintransactions').createIndex({ auditEventId: 1 });
        console.log('✅ blockchaintransactions collection created with indexes');
        
        // Create blocks collection
        console.log('\n🔧 Creating blocks collection...');
        await db.createCollection('blocks');
        
        // Create indexes for blocks
        await db.collection('blocks').createIndex({ blockNumber: 1 }, { unique: true });
        await db.collection('blocks').createIndex({ blockHash: 1 }, { unique: true });
        await db.collection('blocks').createIndex({ timestamp: -1 });
        await db.collection('blocks').createIndex({ miner: 1 });
        await db.collection('blocks').createIndex({ gasUsed: 1 });
        console.log('✅ blocks collection created with indexes');
        
        // Verify collections exist
        const collections = await db.listCollections().toArray();
        
        console.log('\n📁 All Collections:');
        collections.forEach(col => {
            console.log(`   - ${col.name}`);
        });
        
        const hasBlockchainTxs = collections.some(c => c.name === 'blockchaintransactions');
        const hasBlocks = collections.some(c => c.name === 'blocks');
        
        console.log('\n🔍 Storage Status:');
        console.log(`   Blockchain Transactions: ${hasBlockchainTxs ? '✅' : '❌'}`);
        console.log(`   Blocks: ${hasBlocks ? '✅' : '❌'}`);
        
        await mongoose.disconnect();
        console.log('\n🎉 Collections created successfully!');
        
    } catch (error) {
        if (error.code === 48) {
            console.log('⚠️  Collections already exist - this is normal');
        } else {
            console.error('❌ Failed to create collections:', error.message);
        }
    }
}

createCollections();
