const mongoose = require('mongoose');
require('dotenv').config();

async function fixDatabaseIndices() {
    try {
        console.log("=== Fix Database Indices ===\n");
        
        // Connect to MongoDB
        await mongoose.connect(process.env.DATABASE_URL);
        console.log("Connected to MongoDB");
        
        // Connect to the database directly
        const db = mongoose.connection.db;
        const collection = db.collection('encryptedfiles');
        
        // Get all files with their current indices
        const files = await collection.find({
            onChainRecordIndex: { $ne: null }
        }).sort({ onChainRecordIndex: 1 }).toArray();
        
        console.log(`Found ${files.length} files with blockchain indices`);
        
        // The blockchain has records at 0,1,2,3,4,5 but database has 1,2,3,4,5
        // We need to map database indices to blockchain indices
        const indexMapping = {
            1: 0,  // Database index 1 should map to blockchain index 0
            2: 1,  // Database index 2 should map to blockchain index 1
            3: 2,  // Database index 3 should map to blockchain index 2
            4: 3,  // Database index 4 should map to blockchain index 3
            5: 4   // Database index 5 should map to blockchain index 4
        };
        
        // Update each file's index
        for (const file of files) {
            const currentDbIndex = file.onChainRecordIndex;
            const correctBlockchainIndex = indexMapping[currentDbIndex];
            
            if (correctBlockchainIndex !== undefined) {
                console.log(`Updating file ${file.fileId}: index ${currentDbIndex} -> ${correctBlockchainIndex}`);
                
                await collection.updateOne(
                    { _id: file._id },
                    { $set: { onChainRecordIndex: correctBlockchainIndex } }
                );
            }
        }
        
        console.log("\nIndex updates completed!");
        
        // Verify the updates
        const updatedFiles = await collection.find({
            onChainRecordIndex: { $ne: null }
        }).sort({ onChainRecordIndex: 1 }).toArray();
        
        console.log("\nUpdated file indices:");
        updatedFiles.forEach(file => {
            console.log(`  ${file.fileId}: index ${file.onChainRecordIndex}`);
        });
        
    } catch (error) {
        console.error('Error fixing database indices:', error);
    } finally {
        await mongoose.disconnect();
    }
}

fixDatabaseIndices().then(() => {
    console.log('\n=== Fix complete ===');
    process.exit(0);
}).catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
});
