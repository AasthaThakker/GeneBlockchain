const mongoose = require('mongoose');
require('dotenv').config();

async function viewGenomicData() {
    try {
        console.log("=== Viewing Actual Genomic Data ===\n");
        
        // Connect to MongoDB
        await mongoose.connect(process.env.DATABASE_URL);
        console.log("Connected to MongoDB");
        
        // Get the EncryptedFile model
        const db = mongoose.connection.db;
        const collection = db.collection('encryptedfiles');
        
        // Get all files
        const files = await collection.find({}).toArray();
        console.log(`Found ${files.length} genomic files\n`);
        
        // Import decryption function
        const { decryptData } = require('./lib/encryption');
        
        // Display each file's content
        for (const file of files) {
            console.log(`=== File: ${file.fileName} ===`);
            console.log(`File ID: ${file.fileId}`);
            console.log(`Patient ID: ${file.pid}`);
            console.log(`File Type: ${file.fileType}`);
            console.log(`File Size: ${file.fileSize} bytes`);
            console.log(`Upload Date: ${file.uploadDate}`);
            
            try {
                // Decrypt the file content
                const decryptedContent = decryptData(file.encryptedData, file.iv);
                
                console.log(`\n--- VCF File Content (Readable) ---`);
                console.log(decryptedContent.toString());
                
            } catch (error) {
                console.error(`Error decrypting file ${file.fileId}:`, error.message);
            }
            
            console.log(`\n${'='.repeat(60)}\n`);
        }
        
    } catch (error) {
        console.error('Error viewing genomic data:', error);
    } finally {
        await mongoose.disconnect();
    }
}

viewGenomicData().then(() => {
    console.log('\n=== View complete ===');
    process.exit(0);
}).catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
});
