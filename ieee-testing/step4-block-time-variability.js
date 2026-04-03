require('dotenv').config({ path: '../.env' });
const { ethers } = require("hardhat");
const mongoose = require('mongoose');

// Global load tracking for block time analysis
global.currentLoad = 0;

async function main() {
    console.log("⛏️ STEP 4: BLOCK CREATION TIME VARIABILITY - IEEE METRIC 4");
    console.log("=" * 70);
    console.log("🎯 Analyzing block intervals under varying transaction loads...\n");

    // Load levels as specified in IEEE requirements
    const LOAD_LEVELS = [
        { users: 5, name: "L1" },
        { users: 20, name: "L2" },
        { users: 50, name: "L3" },
        { users: 100, name: "L4" }
    ];

    try {
        await mongoose.connect('mongodb://localhost:27017/genomic-data-platform');
        console.log("✅ Connected to MongoDB");

        const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
        const [signer] = await ethers.getSigners();
        const contract = await ethers.getContractAt("GenShareRegistry", contractAddress, signer);
        const db = mongoose.connection.db;

        console.log(`📋 Contract: ${contractAddress}`);
        console.log(`📋 Load Levels: ${LOAD_LEVELS.map(l => `${l.name}(${l.users} users)`).join(', ')}\n`);

        const blockResults = [];

        // Execute each load level test for block time analysis
        for (const loadLevel of LOAD_LEVELS) {
            console.log(`🔥 TESTING BLOCK TIME VARIABILITY - ${loadLevel.name}: ${loadLevel.users} users`);
            console.log("-" * 60);

            // Set global load for this test
            global.currentLoad = loadLevel.users;

            // Clear previous blocks for this load level
            await db.collection('blocks').deleteMany({ 
                load: loadLevel.users 
            });

            const blockTimes = [];
            const startTime = Date.now();

            // Execute transactions to generate blocks
            for (let i = 0; i < loadLevel.users; i++) {
                try {
                    const testPid = `BLOCK-TIME-${loadLevel.name}-${i}-${Date.now()}`;
                    const testHash = "0x" + i.toString(16).padStart(64, '0');
                    const testIpfs = `QmBlockTime${loadLevel.name}${i}`;

                    const submissionTime = Date.now();
                    const tx = await contract.registerGenomicData(testPid, testHash, testIpfs);
                    const receipt = await tx.wait();
                    const confirmationTime = Date.now();
                    
                    // Store transaction with load tag
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
                        functionParameters: { pid: testPid, fileHash: testHash, ipfsCID: testIpfs },
                        status: receipt.status === 1,
                        timestamp: new Date(),
                        submissionTime: new Date(submissionTime),
                        confirmationTime: new Date(confirmationTime),
                        latency: confirmationTime - submissionTime,
                        load: loadLevel.users,
                        networkId: 'localhost',
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });
                    
                    // Store block with load information (OPTION A - BEST)
                    if (receipt.blockNumber) {
                        try {
                            const blockData = await ethers.provider.getBlock(receipt.blockNumber);
                            if (blockData) {
                                await db.collection('blocks').insertOne({
                                    blockNumber: blockData.number,
                                    blockHash: blockData.hash || '',
                                    parentHash: blockData.parentHash || '',
                                    timestamp: new Date(blockData.timestamp * 1000),
                                    miner: blockData.miner || '',
                                    difficulty: blockData.difficulty.toString(),
                                    totalDifficulty: blockData.difficulty.toString(),
                                    size: 0,
                                    gasLimit: blockData.gasLimit.toString(),
                                    gasUsed: blockData.gasUsed.toString(),
                                    transactionCount: blockData.transactions.length,
                                    transactionHashes: blockData.transactions.map(tx => typeof tx === 'string' ? tx : tx.hash),
                                    networkId: 'localhost',
                                    load: loadLevel.users, // NEW FIELD: Load level for block time variability analysis
                                    createdAt: new Date(),
                                    updatedAt: new Date()
                                });
                                
                                blockTimes.push({
                                    blockNumber: blockData.number,
                                    timestamp: new Date(blockData.timestamp * 1000),
                                    load: loadLevel.users
                                });
                            }
                        } catch (blockError) {
                            console.log(`  ❌ Block storage failed: ${blockError.message}`);
                        }
                    }
                    
                } catch (error) {
                    console.log(`  ❌ Transaction ${i} failed: ${error.message}`);
                }
            }

            const endTime = Date.now();
            console.log(`\n📊 BLOCK TIME ${loadLevel.name} RESULTS:`);
            console.log(`  - Total Transactions: ${loadLevel.users}`);
            console.log(`  - Blocks Generated: ${blockTimes.length}`);
            console.log(`  - Test Duration: ${((endTime - startTime) / 1000).toFixed(2)}s`);

            blockResults.push({
                load: loadLevel.users,
                loadName: loadLevel.name,
                blockCount: blockTimes.length,
                blockTimes: blockTimes,
                testDuration: (endTime - startTime) / 1000
            });

            // Small delay between load levels
            if (loadLevel.users < 100) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        // Generate comprehensive block time analysis
        console.log("\n📈 COMPREHENSIVE BLOCK TIME ANALYSIS");
        console.log("=" * 50);
        
        console.log("Load\tBlocks\tDuration (s)");
        blockResults.forEach(result => {
            console.log(`${result.loadName}\t${result.blockCount}\t${result.testDuration.toFixed(2)}`);
        });

        // Store comprehensive results
        const summary = {
            testType: 'IEEE_BLOCK_TIME_VARIABILITY_STEP4',
            timestamp: new Date(),
            loadLevels: blockResults.map(r => ({
                load: r.load,
                loadName: r.loadName,
                blockCount: r.blockCount,
                testDuration: r.testDuration,
                blockTimes: r.blockTimes
            })),
            overallStats: {
                totalBlocks: blockResults.reduce((sum, r) => sum + r.blockCount, 0),
                avgTestDuration: blockResults.reduce((sum, r) => sum + r.testDuration, 0) / blockResults.length
            },
            networkId: 'localhost'
        };

        await db.collection('performance-tests').insertOne(summary);
        console.log(`\n💾 Block time analysis summary stored in database`);

    } catch (error) {
        console.error("❌ Error:", error.message);
        console.error(error.stack);
    } finally {
        await mongoose.disconnect();
        console.log("\n🔌 Disconnected from MongoDB");
    }
}

main();
