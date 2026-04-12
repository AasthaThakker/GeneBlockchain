#!/usr/bin/env node

/**
 * File Access Demo Script
 * 
 * This script demonstrates how to access encrypted files stored in MongoDB
 * and shows where they are physically located.
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

// MongoDB connection
const MONGODB_URI = process.env.DATABASE_URL || 'mongodb://localhost:27017/genomic-data-platform';

// Encryption configuration (same as in lib/encryption.ts)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
const ALGORITHM = 'aes-256-cbc';

// Simple schema for demo
const EncryptedFileSchema = new mongoose.Schema({
  fileId: String,
  fileName: String,
  fileType: String,
  encryptedData: Buffer,
  iv: Buffer,
  fileHash: String,
  pid: String,
  labId: String,
  labName: String,
  fileSize: Number,
  uploadDate: Date,
  status: String
});

const EncryptedFile = mongoose.model('EncryptedFile', EncryptedFileSchema);

// Decryption function
function decrypt(encryptedData, iv) {
  const decipher = crypto.createDecipher(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'));
  decipher.setIV(iv);
  let decrypted = decipher.update(encryptedData);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted;
}

async function demonstrateFileAccess() {
  try {
    console.log('=== GeneBlockchain File Access Demo ===\n');
    
    // Connect to MongoDB
    console.log('1. Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('   Connected to: genomic-data-platform\n');
    
    // Show database info
    console.log('2. Database Information:');
    console.log('   Database: genomic-data-platform');
    console.log('   Collection: encryptedfiles');
    console.log('   Physical Location: MongoDB data files on disk\n');
    
    // Count files
    const fileCount = await EncryptedFile.countDocuments();
    console.log(`3. Total encrypted files stored: ${fileCount}\n`);
    
    if (fileCount === 0) {
      console.log('No files found. Please upload a file first.');
      return;
    }
    
    // List all files
    console.log('4. All stored files:');
    const files = await EncryptedFile.find({}, {
      fileId: 1,
      fileName: 1,
      fileType: 1,
      pid: 1,
      labId: 1,
      fileSize: 1,
      uploadDate: 1,
      status: 1
    });
    
    files.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file.fileName}`);
      console.log(`      File ID: ${file.fileId}`);
      console.log(`      Type: ${file.fileType}`);
      console.log(`      Patient: ${file.pid}`);
      console.log(`      Lab: ${file.labId}`);
      console.log(`      Size: ${file.fileSize} bytes`);
      console.log(`      Status: ${file.status}`);
      console.log(`      Uploaded: ${file.uploadDate.toISOString()}\n`);
    });
    
    // Demonstrate accessing a specific file
    if (files.length > 0) {
      const sampleFile = await EncryptedFile.findOne({ fileId: files[0].fileId });
      
      console.log('5. File Storage Details:');
      console.log(`   File: ${sampleFile.fileName}`);
      console.log(`   Storage Location: MongoDB encryptedfiles collection`);
      console.log(`   Document ID: ${sampleFile._id}`);
      console.log(`   Encrypted Data Size: ${sampleFile.encryptedData.length} bytes`);
      console.log(`   IV Size: ${sampleFile.iv.length} bytes`);
      console.log(`   File Hash: ${sampleFile.fileHash}\n`);
      
      console.log('6. Decryption Demo:');
      console.log('   Decrypting file content...');
      
      try {
        const decryptedContent = decrypt(sampleFile.encryptedData, sampleFile.iv);
        console.log('   Decryption successful!');
        console.log(`   Original file size: ${decryptedContent.length} bytes`);
        console.log(`   First 100 characters: ${decryptedContent.toString().substring(0, 100)}...\n`);
        
        // Save decrypted file
        const fs = require('fs');
        const outputPath = `demo_decrypted_${sampleFile.fileName}`;
        fs.writeFileSync(outputPath, decryptedContent);
        console.log(`7. Decrypted file saved to: ${outputPath}`);
        
      } catch (decryptError) {
        console.log('   Decryption failed:', decryptError.message);
      }
    }
    
    console.log('\n=== Storage Summary ===');
    console.log('Files are stored as encrypted binary data in MongoDB documents.');
    console.log('They are NOT stored as separate files on the filesystem.');
    console.log('Physical location: MongoDB data files on disk (managed by MongoDB server).');
    
  } catch (error) {
    console.error('Demo error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB.');
  }
}

// MongoDB query examples
async function showMongoQueries() {
  console.log('\n=== MongoDB Query Examples ===');
  console.log('You can run these queries in MongoDB Shell (mongosh):\n');
  
  console.log('// Connect to database');
  console.log('use genomic-data-platform\n');
  
  console.log('// 1. Count all files');
  console.log('db.encryptedfiles.countDocuments()\n');
  
  console.log('// 2. List all files (basic info)');
  console.log('db.encryptedfiles.find({}, {fileId: 1, fileName: 1, pid: 1, fileSize: 1})\n');
  
  console.log('// 3. Find files by patient');
  console.log('db.encryptedfiles.find({pid: "PID-001"})\n');
  
  console.log('// 4. Find files by lab');
  console.log('db.encryptedfiles.find({labId: "LAB-001"})\n');
  
  console.log('// 5. Get specific file details');
  console.log('db.encryptedfiles.findOne({fileId: "FILE_1775840469224_56CD24F029E961A7"})\n');
  
  console.log('// 6. Show file storage size');
  console.log('db.encryptedfiles.stats()');
}

// Run demo
if (require.main === module) {
  demonstrateFileAccess().then(() => {
    showMongoQueries();
    process.exit(0);
  }).catch(error => {
    console.error('Demo failed:', error);
    process.exit(1);
  });
}

module.exports = { demonstrateFileAccess, showMongoQueries };
