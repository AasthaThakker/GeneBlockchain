const mongoose = require('mongoose');
require('dotenv').config();

async function clearAndRegister() {
    try {
        console.log("=== Clear and Register Files ===\n");
        
        // Connect to MongoDB
        await mongoose.connect(process.env.DATABASE_URL);
        console.log("Connected to MongoDB");
        
        // Get the EncryptedFile model
        const { EncryptedFile } = require('./lib/models/EncryptedFile');
        
        // Step 1: Clear all blockchain references
        console.log("Step 1: Clearing old blockchain references...");
        const clearResult = await EncryptedFile.updateMany(
            {},
            { 
                $unset: {
                    onChainRecordIndex: 1,
                    blockchainTxHash: 1
                }
            }
        );
        console.log(`Cleared blockchain references from ${clearResult.modifiedCount} files`);
        
        // Step 2: Get all files
        const files = await EncryptedFile.find({}).lean();
        console.log(`Found ${files.length} files to register`);
        
        // Step 3: Register each file on blockchain
        const { registerGenomicData } = require('./lib/blockchain');
        let successCount = 0;
        let failCount = 0;
        
        for (const file of files) {
            try {
                console.log(`Registering file ${file.fileId}...`);
                
                // Register on blockchain
                const result = await registerGenomicData(file.pid, file.fileHash, file.fileId);
                
                // Update file with blockchain info
                await EncryptedFile.updateOne(
                    { fileId: file.fileId },
                    { 
                        $set: {
                            blockchainTxHash: result.txHash,
                            onChainRecordIndex: result.recordIndex
                        }
                    }
                );
                
                console.log(`  Success: Record ${result.recordIndex}, TX: ${result.txHash}`);
                successCount++;
                
            } catch (error) {
                console.error(`  Failed: ${error.message}`);
                failCount++;
            }
        }
        
        console.log(`\n=== Registration Summary ===`);
        console.log(`Total Files: ${files.length}`);
        console.log(`Successful: ${successCount}`);
        console.log(`Failed: ${failCount}`);
        
        // Step 4: Verify blockchain state
        const { getOnChainRecordCount } = require('./lib/blockchain');
        const recordCount = await getOnChainRecordCount();
        console.log(`Blockchain record count: ${recordCount}`);
        
    } catch (error) {
        console.error('Error in clear and register:', error);
    } finally {
        await mongoose.disconnect();
    }
}

// Run the process
clearAndRegister().then(() => {
    console.log('\n=== Process complete ===');
    process.exit(0);
}).catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
});
