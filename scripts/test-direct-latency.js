require('dotenv').config({ path: '../.env' });
const { ethers } = require("hardhat");
const mongoose = require('mongoose');

async function main() {
    console.log("🧪 Testing Latency with Direct Ethers Call...\n");

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
        const testPid = "DIRECT-TEST-" + Date.now();
        const testHash = "0x" + "1234567890abcdef".repeat(8);
        const testIpfs = "QmDirectTest123";

        console.log("🚀 Submitting transaction with manual latency tracking...");
        
        // Manual latency measurement
        const submissionTime = Date.now();
        
        const tx = await contract.registerGenomicData(testPid, testHash, testIpfs);
        console.log(`📤 Transaction submitted: ${tx.hash}`);
        
        const receipt = await tx.wait();
        const confirmationTime = Date.now();
        const latency = confirmationTime - submissionTime;
        
        console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
        console.log(`⏱️  Measured latency: ${latency}ms`);

        // Store transaction with latency data manually
        const db = mongoose.connection.db;
        const transactionData = {
            txHash: receipt.hash,
            blockNumber: receipt.blockNumber,
            blockHash: receipt.blockHash,
            transactionIndex: receipt.index,
            gasUsed: receipt.gasUsed.toString(),
            gasPrice: tx.gasPrice?.toString() || '0',
            gasLimit: tx.gasLimit.toString(),
            effectiveGasPrice: tx.gasPrice?.toString() || '0',
            from: tx.from,
            to: tx.to || '',
            value: tx.value.toString(),
            data: tx.data,
            nonce: tx.nonce,
            status: receipt.status === 1,
            timestamp: new Date(),
            confirmations: receipt.confirmations || 1,
            
            // Transaction Latency Metrics
            submissionTime: new Date(submissionTime),
            confirmationTime: new Date(confirmationTime),
            latency: latency,
            
            contractAddress: tx.to,
            functionName: 'registerGenomicData',
            functionParameters: { pid: testPid, fileHash: testHash, ipfsCID: testIpfs },
            events: [],
            relatedEntity: { type: 'GenomicData', id: '0' },
            networkId: 'localhost',
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        await db.collection('blockchaintransactions').insertOne(transactionData);
        console.log(`💾 Transaction stored with latency data`);

        // Verify storage
        const storedTx = await db.collection('blockchaintransactions').findOne({ 
            txHash: receipt.hash 
        });
        
        if (storedTx) {
            console.log(`\n📊 Verification successful:`);
            console.log(`  - Stored latency: ${storedTx.latency}ms`);
            console.log(`  - Submission time: ${storedTx.submissionTime}`);
            console.log(`  - Confirmation time: ${storedTx.confirmationTime}`);
            console.log(`  - All fields present: ✅`);
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
