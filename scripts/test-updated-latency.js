require('dotenv').config({ path: '../.env' });
const { ethers } = require("hardhat");
const mongoose = require('mongoose');

async function main() {
    console.log("🧪 Testing Updated Latency Implementation...\n");

    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb://localhost:27017/genomic-data-platform');
        console.log("✅ Connected to MongoDB");

        // Get contract
        const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
        if (!contractAddress) {
            console.error("❌ NEXT_PUBLIC_CONTRACT_ADDRESS not set");
            return;
        }

        const [signer] = await ethers.getSigners();
        const contract = await ethers.getContractAt("GenShareRegistry", contractAddress, signer);

        console.log(`📋 Contract: ${contractAddress}`);
        console.log(`👤 Signer: ${signer.address}\n`);

        // Test data
        const testPid = "LATENCY-TEST-" + Date.now();
        const testHash = "0x" + "abcdef1234567890".repeat(8);
        const testIpfs = "QmLatencyTest123";

        console.log("🚀 Submitting transaction with new implementation...");
        
        // Use correct relative path
        const { registerGenomicData } = require('../lib/blockchain');
        
        const result = await registerGenomicData(testPid, testHash, testIpfs);
        
        console.log(`✅ Transaction completed:`);
        console.log(`  - Hash: ${result.txHash}`);
        console.log(`  - Record Index: ${result.recordIndex}`);
        console.log(`  - Latency: ${result.latency}ms`);

        // Check database
        const db = mongoose.connection.db;
        const storedTx = await db.collection('blockchaintransactions').findOne({ 
            txHash: result.txHash 
        });
        
        if (storedTx) {
            console.log(`\n📊 Stored in database:`);
            console.log(`  - latency: ${storedTx.latency}ms`);
            console.log(`  - submissionTime: ${storedTx.submissionTime}`);
            console.log(`  - confirmationTime: ${storedTx.confirmationTime}`);
            console.log(`  - All latency fields present: ${storedTx.latency !== undefined && storedTx.submissionTime !== undefined && storedTx.confirmationTime !== undefined}`);
        } else {
            console.log("❌ Transaction not found in database");
        }

    } catch (error) {
        console.error("❌ Error:", error.message);
        console.error(error.stack);
    } finally {
        await mongoose.disconnect();
        console.log("\n🔌 Disconnected");
    }
}

main();
