const mongoose = require('mongoose');
require('dotenv').config();

async function clearBlockchainRefs() {
    try {
        console.log("=== Clear Blockchain References ===\n");
        
        // Connect to MongoDB
        await mongoose.connect(process.env.DATABASE_URL);
        console.log("Connected to MongoDB");
        
        // Connect to the database directly
        const db = mongoose.connection.db;
        const collection = db.collection('encryptedfiles');
        
        // Clear blockchain references from all files
        console.log("Clearing blockchain references...");
        const result = await collection.updateMany(
            {},
            { 
                $unset: {
                    onChainRecordIndex: "",
                    blockchainTxHash: ""
                }
            }
        );
        
        console.log(`Updated ${result.modifiedCount} files`);
        console.log("Blockchain references cleared successfully!");
        
        // Verify the clearing
        const checkResult = await collection.find({
            $or: [
                { onChainRecordIndex: { $exists: true } },
                { blockchainTxHash: { $exists: true } }
            ]
        }).toArray();
        
        console.log(`Files with blockchain references remaining: ${checkResult.length}`);
        
    } catch (error) {
        console.error('Error clearing blockchain references:', error);
    } finally {
        await mongoose.disconnect();
    }
}

clearBlockchainRefs().then(() => {
    console.log('\n=== Clear complete ===');
    process.exit(0);
}).catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
});
