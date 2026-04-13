const mongoose = require('mongoose');
require('dotenv').config();

async function checkStoredData() {
    try {
        console.log("=== GenShare Data Storage Verification ===\n");
        
        // Connect to MongoDB
        await mongoose.connect(process.env.DATABASE_URL);
        console.log("Connected to MongoDB:", process.env.DATABASE_URL);
        
        // Get the EncryptedFile model
        const { EncryptedFile } = require('./lib/models/EncryptedFile');
        
        // Find all files
        const files = await EncryptedFile.find({}).lean();
        
        console.log(`Total files stored: ${files.length}\n`);
        
        if (files.length === 0) {
            console.log("No files found in database.");
            return;
        }
        
        // Display each file's details
        files.forEach((file, index) => {
            console.log(`=== File ${index + 1}: ${file.fileName} ===`);
            console.log(`File ID: ${file.fileId}`);
            console.log(`File Type: ${file.fileType}`);
            console.log(`File Size: ${file.fileSize} bytes`);
            console.log(`Patient ID: ${file.pid}`);
            console.log(`Lab ID: ${file.labId}`);
            console.log(`Lab Name: ${file.labName}`);
            console.log(`Upload Date: ${file.uploadDate}`);
            console.log(`Status: ${file.status}`);
            
            // Hash information
            console.log(`\n--- HASH INFORMATION ---`);
            console.log(`SHA-256 Hash: ${file.fileHash}`);
            console.log(`Hash Length: ${file.fileHash.length} characters`);
            
            // Blockchain information
            console.log(`\n--- BLOCKCHAIN INFORMATION ---`);
            console.log(`On-Chain Record Index: ${file.onChainRecordIndex || 'Not registered'}`);
            console.log(`Blockchain TX Hash: ${file.blockchainTxHash || 'Not registered'}`);
            
            // Patient demographics
            console.log(`\n--- PATIENT DEMOGRAPHICS ---`);
            console.log(`Age: ${file.patientAge || 'Not specified'}`);
            console.log(`Gender: ${file.patientGender || 'Not specified'}`);
            console.log(`Geographic Region: ${file.geographicRegion || 'Not specified'}`);
            
            // Tags
            if (file.tags && file.tags.length > 0) {
                console.log(`\n--- TAGS ---`);
                console.log(`Tags: ${file.tags.join(', ')}`);
            }
            
            console.log(`\n${'='.repeat(50)}\n`);
        });
        
        // Summary statistics
        const registeredFiles = files.filter(f => f.onChainRecordIndex !== undefined && f.onChainRecordIndex >= 0);
        const verifiedFiles = files.filter(f => f.status === 'Verified');
        
        console.log(`=== SUMMARY STATISTICS ===`);
        console.log(`Total Files: ${files.length}`);
        console.log(`Registered on Blockchain: ${registeredFiles.length}`);
        console.log(`Verified Status: ${verifiedFiles.length}`);
        console.log(`Pending Registration: ${files.length - registeredFiles.length}`);
        
        // Show hash verification
        console.log(`\n=== HASH VERIFICATION ===`);
        files.forEach(file => {
            const isSHA256 = /^[a-f0-9]{64}$/i.test(file.fileHash);
            console.log(`${file.fileId}: ${isSHA256 ? 'Valid SHA-256' : 'Invalid Hash Format'} - ${file.fileHash.substring(0, 16)}...`);
        });
        
    } catch (error) {
        console.error('Error checking stored data:', error);
    } finally {
        await mongoose.disconnect();
    }
}

// Run the check
checkStoredData().then(() => {
    console.log('\n=== Data verification complete ===');
    process.exit(0);
}).catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
});
