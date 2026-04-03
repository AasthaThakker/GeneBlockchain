require('dotenv').config({ path: '../.env' });
const { ethers } = require("hardhat");
const mongoose = require('mongoose');

async function main() {
    console.log("🔥 STEP 2: GAS COST ANALYSIS - IEEE METRIC 2");
    console.log("=" .repeat(50));
    console.log("🎯 Generating transactions with operation types...\n");

    // Simplified configuration
    const OPERATIONS = {
        UPLOAD: 50,
        CONSENT: 30,
        VERIFY: 20
    };

    try {
        await mongoose.connect('mongodb://localhost:27017/genomic-data-platform');
        console.log("✅ Connected to MongoDB");

        const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
        const [signer] = await ethers.getSigners();
        const contract = await ethers.getContractAt("GenShareRegistry", contractAddress, signer);
        const db = mongoose.connection.db;

        console.log(`📋 Contract: ${contractAddress}`);
        console.log(`📋 Total operations: ${Object.values(OPERATIONS).reduce((a, b) => a + b, 0)}\n`);

        let totalCompleted = 0;

        // Execute UPLOAD operations
        console.log("🔥 UPLOAD OPERATIONS (50 transactions)");
        for (let i = 0; i < OPERATIONS.UPLOAD; i++) {
            try {
                const testPid = `GAS-UPLOAD-${i}-${Date.now()}`;
                const testHash = "0x" + i.toString(16).padStart(64, '0');
                const testIpfs = `QmGasUpload${i}`;
                
                const submissionTime = Date.now();
                const tx = await contract.registerGenomicData(testPid, testHash, testIpfs);
                const receipt = await tx.wait();
                const confirmationTime = Date.now();
                
                const gasUsed = receipt.gasUsed.toNumber();
                const gasCostWei = receipt.gasUsed * (receipt.effectiveGasPrice || receipt.gasPrice || 0);
                const gasCostETH = Number(gasCostWei) / Math.pow(10, 18);
                
                await db.collection('blockchaintransactions').insertOne({
                    txHash: receipt.hash,
                    blockNumber: receipt.blockNumber,
                    gasUsed: receipt.gasUsed.toString(),
                    gasPrice: receipt.gasPrice?.toString() || '0',
                    effectiveGasPrice: receipt.effectiveGasPrice?.toString() || '0',
                    from: tx.from,
                    to: tx.to || '',
                    functionName: 'registerGenomicData',
                    operationType: 'UPLOAD',
                    gasCostETH: gasCostETH.toString(),
                    functionParameters: { pid: testPid, fileHash: testHash, ipfsCID: testIpfs },
                    status: receipt.status === 1,
                    timestamp: new Date(),
                    submissionTime: new Date(submissionTime),
                    confirmationTime: new Date(confirmationTime),
                    latency: confirmationTime - submissionTime,
                    networkId: 'localhost',
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                
                totalCompleted++;
                if (totalCompleted % 10 === 0) {
                    console.log(`  ✅ ${totalCompleted} completed (${gasUsed} gas, ${gasCostETH.toFixed(8)} ETH)`);
                }
                
            } catch (error) {
                console.log(`  ❌ Upload ${i} failed: ${error.message}`);
            }
        }

        // Execute CONSENT operations  
        console.log("\n🔥 CONSENT OPERATIONS (30 transactions)");
        for (let i = 0; i < OPERATIONS.CONSENT; i++) {
            try {
                const testPid = `GAS-CONSENT-${i}`;
                const researcher = signer.address;
                const recordIndex = i % 10;
                const durationDays = 30;
                
                const submissionTime = Date.now();
                const tx = await contract.grantConsent(testPid, researcher, recordIndex, durationDays);
                const receipt = await tx.wait();
                const confirmationTime = Date.now();
                
                const gasUsed = receipt.gasUsed.toNumber();
                const gasCostWei = receipt.gasUsed * (receipt.effectiveGasPrice || receipt.gasPrice || 0);
                const gasCostETH = Number(gasCostWei) / Math.pow(10, 18);
                
                await db.collection('blockchaintransactions').insertOne({
                    txHash: receipt.hash,
                    blockNumber: receipt.blockNumber,
                    gasUsed: receipt.gasUsed.toString(),
                    gasPrice: receipt.gasPrice?.toString() || '0',
                    effectiveGasPrice: receipt.effectiveGasPrice?.toString() || '0',
                    from: tx.from,
                    to: tx.to || '',
                    functionName: 'grantConsent',
                    operationType: 'CONSENT',
                    gasCostETH: gasCostETH.toString(),
                    functionParameters: { pid: testPid, researcherAddress: researcher, recordIndex, durationDays },
                    status: receipt.status === 1,
                    timestamp: new Date(),
                    submissionTime: new Date(submissionTime),
                    confirmationTime: new Date(confirmationTime),
                    latency: confirmationTime - submissionTime,
                    networkId: 'localhost',
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                
                totalCompleted++;
                if (totalCompleted % 10 === 0) {
                    console.log(`  ✅ ${totalCompleted} completed (${gasUsed} gas, ${gasCostETH.toFixed(8)} ETH)`);
                }
                
            } catch (error) {
                console.log(`  ❌ Consent ${i} failed: ${error.message}`);
            }
        }

        // Execute VERIFY operations
        console.log("\n🔥 VERIFY OPERATIONS (20 transactions)");
        for (let i = 0; i < OPERATIONS.VERIFY; i++) {
            try {
                const recordIndex = i % 10;
                const testHash = "0x" + i.toString(16).padStart(64, '0');
                
                const submissionTime = Date.now();
                const tx = await contract.verifyIntegrity(recordIndex, testHash);
                const receipt = await tx.wait();
                const confirmationTime = Date.now();
                
                const gasUsed = receipt.gasUsed.toNumber();
                const gasCostWei = receipt.gasUsed * (receipt.effectiveGasPrice || receipt.gasPrice || 0);
                const gasCostETH = Number(gasCostWei) / Math.pow(10, 18);
                
                await db.collection('blockchaintransactions').insertOne({
                    txHash: receipt.hash,
                    blockNumber: receipt.blockNumber,
                    gasUsed: receipt.gasUsed.toString(),
                    gasPrice: receipt.gasPrice?.toString() || '0',
                    effectiveGasPrice: receipt.effectiveGasPrice?.toString() || '0',
                    from: tx.from,
                    to: tx.to || '',
                    functionName: 'verifyIntegrity',
                    operationType: 'VERIFY',
                    gasCostETH: gasCostETH.toString(),
                    functionParameters: { recordIndex, fileHash: testHash },
                    status: receipt.status === 1,
                    timestamp: new Date(),
                    submissionTime: new Date(submissionTime),
                    confirmationTime: new Date(confirmationTime),
                    latency: confirmationTime - submissionTime,
                    networkId: 'localhost',
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                
                totalCompleted++;
                if (totalCompleted % 10 === 0) {
                    console.log(`  ✅ ${totalCompleted} completed (${gasUsed} gas, ${gasCostETH.toFixed(8)} ETH)`);
                }
                
            } catch (error) {
                console.log(`  ❌ Verify ${i} failed: ${error.message}`);
            }
        }

        // Generate analysis
        console.log("\n📊 GAS ANALYSIS SUMMARY");
        console.log("=" .repeat(30));
        
        const gasAnalysis = await db.collection('blockchaintransactions').aggregate([
            { $match: { operationType: { $exists: true } } },
            { $group: {
                _id: '$operationType',
                count: { $sum: 1 },
                avgGasUsed: { $avg: '$gasUsed' },
                totalGasUsed: { $sum: '$gasUsed' },
                avgCostETH: { $avg: '$gasCostETH' },
                totalCostETH: { $sum: '$gasCostETH' }
            }}
        ]).toArray();

        gasAnalysis.forEach(op => {
            console.log(`\n${op._id}:`);
            console.log(`  - Count: ${op.count}`);
            console.log(`  - Avg Gas: ${Math.round(op.avgGasUsed).toLocaleString()}`);
            console.log(`  - Total Gas: ${op.totalGasUsed.toLocaleString()}`);
            console.log(`  - Avg Cost: ${op.avgCostETH.toFixed(8)} ETH`);
            console.log(`  - Total Cost: ${op.totalCostETH.toFixed(8)} ETH`);
        });

        console.log(`\n✅ Total transactions with operation types: ${totalCompleted}`);
        console.log("🎯 STEP 2.1, 2.2, 2.3 COMPLETED!");

    } catch (error) {
        console.error("❌ Error:", error.message);
    } finally {
        await mongoose.disconnect();
        console.log("\n🔌 Disconnected from MongoDB");
    }
}

main();
