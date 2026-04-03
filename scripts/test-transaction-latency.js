require('dotenv').config();
const { ethers } = require("hardhat");
const mongoose = require('mongoose');

async function main() {
    console.log("🧪 Testing Transaction Latency Measurement...\n");

    // Connect to MongoDB
    try {
        await mongoose.connect('mongodb://localhost:27017/genomic-data-platform');
        console.log("✅ Connected to MongoDB");
    } catch (error) {
        console.error("❌ Failed to connect to MongoDB:", error.message);
        return;
    }

    // Get contract
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    if (!contractAddress) {
        console.error("❌ NEXT_PUBLIC_CONTRACT_ADDRESS not set in .env");
        return;
    }

    const [signer] = await ethers.getSigners();
    const contract = await ethers.getContractAt("GenShareRegistry", contractAddress, signer);

    console.log(`📋 Using contract: ${contractAddress}`);
    console.log(`👤 Signer: ${signer.address}\n`);

    // Test data
    const testPid = "TEST-PID-" + Date.now();
    const testHash = "0x" + "1234567890abcdef".repeat(8); // 64 char hex
    const testIpfs = "QmTest123456789";

    console.log("🚀 Submitting test transaction...");
    
    // Track submission time manually to verify
    const submissionTime = Date.now();
    
    try {
        // Submit transaction
        const tx = await contract.registerGenomicData(testPid, testHash, testIpfs);
        console.log(`📤 Transaction submitted: ${tx.hash}`);
        
        // Wait for confirmation
        const receipt = await tx.wait();
        const confirmationTime = Date.now();
        const measuredLatency = confirmationTime - submissionTime;
        
        console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
        console.log(`⏱️  Measured latency: ${measuredLatency}ms`);
        
        // Check database for stored latency
        const db = mongoose.connection.db;
        const storedTx = await db.collection('blockchaintransactions').findOne({ 
            txHash: receipt.hash 
        });
        
        if (storedTx) {
            console.log("\n📊 Stored Transaction Data:");
            console.log(`  - txHash: ${storedTx.txHash}`);
            console.log(`  - submissionTime: ${storedTx.submissionTime}`);
            console.log(`  - confirmationTime: ${storedTx.confirmationTime}`);
            console.log(`  - latency: ${storedTx.latency}ms`);
            console.log(`  - functionName: ${storedTx.functionName}`);
            
            // Verify latency calculation
            const storedLatency = storedTx.confirmationTime - storedTx.submissionTime;
            console.log(`\n🔍 Verification:`);
            console.log(`  - Stored latency: ${storedTx.latency}ms`);
            console.log(`  - Calculated from timestamps: ${storedLatency}ms`);
            console.log(`  - Measured latency: ${measuredLatency}ms`);
            
            if (Math.abs(storedTx.latency - measuredLatency) < 100) {
                console.log("✅ Latency measurement is accurate!");
            } else {
                console.log("⚠️  Latency measurement has significant difference");
            }
        } else {
            console.log("❌ Transaction not found in database");
        }
        
        // Get recent transactions with latency data
        console.log("\n📈 Recent Transactions with Latency:");
        const recentTxs = await db.collection('blockchaintransactions')
            .find({ latency: { $exists: true } })
            .sort({ timestamp: -1 })
            .limit(5)
            .toArray();
            
        recentTxs.forEach((tx, index) => {
            console.log(`  ${index + 1}. ${tx.txHash.slice(0, 10)}... - ${tx.latency}ms - ${tx.functionName}`);
        });
        
    } catch (error) {
        console.error("❌ Transaction failed:", error.message);
    }

    // Close connection
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
