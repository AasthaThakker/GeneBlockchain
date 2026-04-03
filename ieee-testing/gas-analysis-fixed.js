require('dotenv').config({ path: '../.env' });
const { ethers } = require("hardhat");
const mongoose = require('mongoose');

async function main() {
    console.log("🔥 STEP 2: GAS COST ANALYSIS - IEEE METRIC 2");
    console.log("=" .repeat(50));
    console.log("🎯 Generating transactions with operation types...\n");

    try {
        await mongoose.connect('mongodb://localhost:27017/genomic-data-platform');
        console.log("✅ Connected to MongoDB");

        const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
        const [signer] = await ethers.getSigners();
        const contract = await ethers.getContractAt("GenShareRegistry", contractAddress, signer);
        const db = mongoose.connection.db;

        console.log(`📋 Contract: ${contractAddress}\n`);

        let totalCompleted = 0;

        // Execute UPLOAD operations (50)
        console.log("🔥 UPLOAD OPERATIONS (50 transactions)");
        for (let i = 0; i < 50; i++) {
            try {
                const testPid = `GAS-UPLOAD-${i}-${Date.now()}`;
                const testHash = "0x" + i.toString(16).padStart(64, '0');
                const testIpfs = `QmGasUpload${i}`;
                
                const submissionTime = Date.now();
                const tx = await contract.registerGenomicData(testPid, testHash, testIpfs);
                const receipt = await tx.wait();
                const confirmationTime = Date.now();
                
                // Fixed gas handling for ethers v6
                const gasUsed = Number(receipt.gasUsed);
                const gasPrice = Number(receipt.gasPrice || 0);
                const gasCostWei = BigInt(receipt.gasUsed) * BigInt(receipt.gasPrice || 0);
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
                    console.log(`  ✅ ${totalCompleted} completed (${gasUsed.toLocaleString()} gas, ${gasCostETH.toFixed(8)} ETH)`);
                }
                
            } catch (error) {
                console.log(`  ❌ Upload ${i} failed: ${error.message}`);
            }
        }

        // Execute CONSENT operations (30)
        console.log("\n🔥 CONSENT OPERATIONS (30 transactions)");
        for (let i = 0; i < 30; i++) {
            try {
                const testPid = `GAS-CONSENT-${i}`;
                const researcher = signer.address;
                const recordIndex = i % 10;
                const durationDays = 30;
                
                const submissionTime = Date.now();
                const tx = await contract.grantConsent(testPid, researcher, recordIndex, durationDays);
                const receipt = await tx.wait();
                const confirmationTime = Date.now();
                
                const gasUsed = Number(receipt.gasUsed);
                const gasCostWei = BigInt(receipt.gasUsed) * BigInt(receipt.gasPrice || 0);
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
                    console.log(`  ✅ ${totalCompleted} completed (${gasUsed.toLocaleString()} gas, ${gasCostETH.toFixed(8)} ETH)`);
                }
                
            } catch (error) {
                console.log(`  ❌ Consent ${i} failed: ${error.message}`);
            }
        }

        // Skip VERIFY operations (they're read-only and don't consume gas)
        console.log("\n⚠️  VERIFY operations skipped (read-only, no gas consumption)");

        // Generate analysis
        console.log("\n📊 GAS ANALYSIS SUMMARY");
        console.log("=" .repeat(30));
        
        const gasAnalysis = await db.collection('blockchaintransactions').aggregate([
            { $match: { operationType: { $exists: true } } },
            { $group: {
                _id: '$operationType',
                count: { $sum: 1 },
                avgGasUsed: { $avg: { $toDecimal: '$gasUsed' } },
                totalGasUsed: { $sum: { $toDecimal: '$gasUsed' } },
                avgCostETH: { $avg: { $toDecimal: '$gasCostETH' } },
                totalCostETH: { $sum: { $toDecimal: '$gasCostETH' } }
            }}
        ]).toArray();

        gasAnalysis.forEach(op => {
            console.log(`\n${op._id}:`);
            console.log(`  - Count: ${op.count}`);
            console.log(`  - Avg Gas: ${Math.round(Number(op.avgGasUsed)).toLocaleString()}`);
            console.log(`  - Total Gas: ${Number(op.totalGasUsed).toLocaleString()}`);
            console.log(`  - Avg Cost: ${Number(op.avgCostETH).toFixed(8)} ETH`);
            console.log(`  - Total Cost: ${Number(op.totalCostETH).toFixed(8)} ETH`);
        });

        console.log(`\n✅ Total transactions with operation types: ${totalCompleted}`);
        console.log("🎯 STEP 2.1, 2.2, 2.3 COMPLETED!");

        // Store summary
        const summary = {
            testType: 'IEEE_GAS_ANALYSIS_STEP2',
            timestamp: new Date(),
            totalTransactions: totalCompleted,
            operationTypes: gasAnalysis,
            networkId: 'localhost'
        };
        
        await db.collection('performance-tests').insertOne(summary);
        console.log("💾 Gas analysis summary stored in database");

    } catch (error) {
        console.error("❌ Error:", error.message);
    } finally {
        await mongoose.disconnect();
        console.log("\n🔌 Disconnected from MongoDB");
    }
}

main();
