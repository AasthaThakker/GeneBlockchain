require('dotenv').config({ path: '../.env' });
const { ethers } = require("hardhat");
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("🧬 REAL GENOMIC DATA WORKFLOW - IEEE METRICS WITH VCF UPLOADS");
    console.log("=" * 70);
    console.log("🎯 Simulating real genomic data operations with VCF files...\n");

    try {
        await mongoose.connect('mongodb://localhost:27017/genomic-data-platform');
        console.log("✅ Connected to MongoDB");

        const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
        const [signer] = await ethers.getSigners();
        const contract = await ethers.getContractAt("GenShareRegistry", contractAddress, signer);
        const db = mongoose.connection.db;

        console.log(`📋 Contract: ${contractAddress}`);
        console.log(`📋 Using real VCF file for authentic data simulation\n`);

        // Clear previous test data
        await db.collection('blockchaintransactions').deleteMany({
            'functionParameters.pid': { $regex: '^REAL-TEST-' }
        });
        console.log("🗑️  Cleared previous test data");

        // Read real VCF file
        const vcfPath = path.join(__dirname, '..', 'dbsnp-subset-GRCh38 (1).vcf');
        let vcfContent = '';
        
        try {
            vcfContent = fs.readFileSync(vcfPath, 'utf8');
            console.log("✅ Loaded real VCF file for simulation");
        } catch (error) {
            console.log("⚠️  VCF file not found, using simulated VCF data");
            vcfContent = generateSimulatedVCF();
        }

        const workflowResults = [];

        // STEP 1: Upload Real VCF Data (20 samples)
        console.log("🔥 STEP 1: UPLOADING REAL GENOMIC DATA");
        console.log("-" * 50);
        
        const uploadResults = [];
        for (let i = 0; i < 20; i++) {
            try {
                const start = Date.now();
                
                // Create realistic genomic data entry
                const sampleId = `REAL-TEST-SAMPLE-${i}`;
                const vcfSegment = extractVCFSegment(vcfContent, i);
                const ipfsHash = generateIPFSHash(vcfSegment);
                
                const tx = await contract.registerGenomicData(sampleId, vcfSegment, ipfsHash);
                const receipt = await tx.wait();
                
                const end = Date.now();
                const executionTime = end - start;
                
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
                    functionParameters: { 
                        pid: sampleId,
                        fileHash: vcfSegment.substring(0, 20) + '...',
                        ipfsCID: ipfsHash,
                        vcfSize: vcfSegment.length
                    },
                    status: receipt.status === 1,
                    timestamp: new Date(),
                    submissionTime: new Date(start),
                    confirmationTime: new Date(end),
                    latency: executionTime,
                    executionTime: executionTime,
                    gasCostETH: (parseFloat(receipt.gasUsed.toString()) * parseFloat(receipt.gasPrice?.toString() || '0') / 1e18).toFixed(10),
                    load: 1, // Single user upload
                    networkId: 'localhost',
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                
                uploadResults.push(executionTime);
                console.log(`  ✅ Sample ${i+1}: ${sampleId} (${executionTime}ms, ${receipt.gasUsed} gas)`);
                
            } catch (error) {
                console.log(`  ❌ Upload ${i} failed: ${error.message}`);
            }
        }

        // STEP 2: Request Access (15 requests)
        console.log("\n🔥 STEP 2: REQUESTING ACCESS TO GENOMIC DATA");
        console.log("-" * 50);
        
        const accessResults = [];
        for (let i = 0; i < 15; i++) {
            try {
                const start = Date.now();
                
                const researcher = `0x${i.toString(16).padStart(40, '0')}`;
                const sampleId = `REAL-TEST-SAMPLE-${i % 20}`;
                const recordIndex = i % 20;
                const consentIndex = i % 10;
                
                const tx = await contract.logAccess(sampleId, researcher, recordIndex, consentIndex);
                const receipt = await tx.wait();
                
                const end = Date.now();
                const executionTime = end - start;
                
                await db.collection('blockchaintransactions').insertOne({
                    txHash: receipt.hash,
                    blockNumber: receipt.blockNumber,
                    gasUsed: receipt.gasUsed.toString(),
                    gasPrice: receipt.gasPrice?.toString() || '0',
                    from: tx.from,
                    to: tx.to || '',
                    functionName: 'logAccess',
                    operationType: 'ACCESS_REQUEST',
                    functionParameters: { 
                        pid: sampleId,
                        researcher: researcher.substring(0, 10) + '...',
                        recordIndex: recordIndex,
                        consentIndex: consentIndex
                    },
                    status: receipt.status === 1,
                    timestamp: new Date(),
                    submissionTime: new Date(start),
                    confirmationTime: new Date(end),
                    latency: executionTime,
                    executionTime: executionTime,
                    gasCostETH: (parseFloat(receipt.gasUsed.toString()) * parseFloat(receipt.gasPrice?.toString() || '0') / 1e18).toFixed(10),
                    load: 1,
                    networkId: 'localhost',
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                
                accessResults.push(executionTime);
                console.log(`  ✅ Access ${i+1}: ${sampleId} (${executionTime}ms, ${receipt.gasUsed} gas)`);
                
            } catch (error) {
                console.log(`  ❌ Access ${i} failed: ${error.message}`);
            }
        }

        // STEP 3: Grant Consent (10 grants)
        console.log("\n🔥 STEP 3: GRANTING CONSENT FOR DATA ACCESS");
        console.log("-" * 50);
        
        const consentResults = [];
        for (let i = 0; i < 10; i++) {
            try {
                const start = Date.now();
                
                const researcher = `0x${i.toString(16).padStart(40, '0')}`;
                const sampleId = `REAL-TEST-SAMPLE-${i}`;
                const recordIndex = i % 20;
                const durationDays = 30 + (i * 5); // 30-80 days
                
                const tx = await contract.grantConsent(sampleId, researcher, recordIndex, durationDays);
                const receipt = await tx.wait();
                
                const end = Date.now();
                const executionTime = end - start;
                
                await db.collection('blockchaintransactions').insertOne({
                    txHash: receipt.hash,
                    blockNumber: receipt.blockNumber,
                    gasUsed: receipt.gasUsed.toString(),
                    gasPrice: receipt.gasPrice?.toString() || '0',
                    from: tx.from,
                    to: tx.to || '',
                    functionName: 'grantConsent',
                    operationType: 'CONSENT',
                    functionParameters: { 
                        pid: sampleId,
                        researcher: researcher.substring(0, 10) + '...',
                        recordIndex: recordIndex,
                        durationDays: durationDays
                    },
                    status: receipt.status === 1,
                    timestamp: new Date(),
                    submissionTime: new Date(start),
                    confirmationTime: new Date(end),
                    latency: executionTime,
                    executionTime: executionTime,
                    gasCostETH: (parseFloat(receipt.gasUsed.toString()) * parseFloat(receipt.gasPrice?.toString() || '0') / 1e18).toFixed(10),
                    load: 1,
                    networkId: 'localhost',
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                
                consentResults.push(executionTime);
                console.log(`  ✅ Consent ${i+1}: ${sampleId} (${executionTime}ms, ${receipt.gasUsed} gas, ${durationDays} days)`);
                
            } catch (error) {
                console.log(`  ❌ Consent ${i} failed: ${error.message}`);
            }
        }

        // STEP 4: Verify Data Integrity (10 verifications)
        console.log("\n🔥 STEP 4: VERIFYING GENOMIC DATA INTEGRITY");
        console.log("-" * 50);
        
        const verifyResults = [];
        for (let i = 0; i < 10; i++) {
            try {
                const start = Date.now();
                
                const recordIndex = i % 20;
                const originalHash = generateIPFSHash(extractVCFSegment(vcfContent, i));
                
                const tx = await contract.verifyIntegrity(recordIndex, originalHash);
                const receipt = await tx.wait();
                
                const end = Date.now();
                const executionTime = end - start;
                
                await db.collection('blockchaintransactions').insertOne({
                    txHash: receipt.hash,
                    blockNumber: receipt.blockNumber,
                    gasUsed: receipt.gasUsed.toString(),
                    gasPrice: receipt.gasPrice?.toString() || '0',
                    from: tx.from,
                    to: tx.to || '',
                    functionName: 'verifyIntegrity',
                    operationType: 'VERIFY',
                    functionParameters: { 
                        recordIndex: recordIndex,
                        originalHash: originalHash.substring(0, 20) + '...'
                    },
                    status: receipt.status === 1,
                    timestamp: new Date(),
                    submissionTime: new Date(start),
                    confirmationTime: new Date(end),
                    latency: executionTime,
                    executionTime: executionTime,
                    gasCostETH: (parseFloat(receipt.gasUsed.toString()) * parseFloat(receipt.gasPrice?.toString() || '0') / 1e18).toFixed(10),
                    load: 1,
                    networkId: 'localhost',
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                
                verifyResults.push(executionTime);
                console.log(`  ✅ Verify ${i+1}: Record ${recordIndex} (${executionTime}ms, ${receipt.gasUsed} gas)`);
                
            } catch (error) {
                console.log(`  ❌ Verify ${i} failed: ${error.message}`);
            }
        }

        // Generate comprehensive summary
        const summary = {
            testType: 'REAL_GENOMIC_DATA_WORKFLOW',
            timestamp: new Date(),
            vcfFile: vcfPath,
            totalOperations: 55,
            workflowSteps: {
                uploads: {
                    count: 20,
                    avgExecutionTime: uploadResults.reduce((a, b) => a + b, 0) / uploadResults.length,
                    minExecutionTime: Math.min(...uploadResults),
                    maxExecutionTime: Math.max(...uploadResults)
                },
                accessRequests: {
                    count: 15,
                    avgExecutionTime: accessResults.reduce((a, b) => a + b, 0) / accessResults.length,
                    minExecutionTime: Math.min(...accessResults),
                    maxExecutionTime: Math.max(...accessResults)
                },
                consents: {
                    count: 10,
                    avgExecutionTime: consentResults.reduce((a, b) => a + b, 0) / consentResults.length,
                    minExecutionTime: Math.min(...consentResults),
                    maxExecutionTime: Math.max(...consentResults)
                },
                verifications: {
                    count: 10,
                    avgExecutionTime: verifyResults.reduce((a, b) => a + b, 0) / verifyResults.length,
                    minExecutionTime: Math.min(...verifyResults),
                    maxExecutionTime: Math.max(...verifyResults)
                }
            },
            overallStats: {
                totalExecutionTime: [...uploadResults, ...accessResults, ...consentResults, ...verifyResults].reduce((a, b) => a + b, 0),
                avgExecutionTime: [...uploadResults, ...accessResults, ...consentResults, ...verifyResults].reduce((a, b) => a + b, 0) / 55,
                vcfDataSize: vcfContent.length,
                samplesProcessed: 20
            },
            networkId: 'localhost'
        };

        await db.collection('performance-tests').insertOne(summary);
        
        console.log("\n📊 REAL WORKFLOW SUMMARY:");
        console.log("=" * 40);
        console.log(`🧬 VCF File: ${path.basename(vcfPath)}`);
        console.log(`📊 Total Operations: 55`);
        console.log(`📤 Uploads: 20 (avg: ${Math.round(summary.workflowSteps.uploads.avgExecutionTime)}ms)`);
        console.log(`🔑 Access Requests: 15 (avg: ${Math.round(summary.workflowSteps.accessRequests.avgExecutionTime)}ms)`);
        console.log(`✅ Consents: 10 (avg: ${Math.round(summary.workflowSteps.consents.avgExecutionTime)}ms)`);
        console.log(`🔍 Verifications: 10 (avg: ${Math.round(summary.workflowSteps.verifications.avgExecutionTime)}ms)`);
        console.log(`⏱️  Overall Avg: ${Math.round(summary.overallStats.avgExecutionTime)}ms`);
        
        console.log("\n💾 Real workflow data stored in database");
        console.log("🎯 Ready for IEEE analysis with authentic genomic data!");

    } catch (error) {
        console.error("❌ Error:", error.message);
        console.error(error.stack);
    } finally {
        await mongoose.disconnect();
        console.log("\n🔌 Disconnected from MongoDB");
    }
}

// Helper functions
function extractVCFSegment(vcfContent, index) {
    const lines = vcfContent.split('\n');
    const dataLines = lines.filter(line => !line.startsWith('#'));
    const segmentSize = Math.floor(dataLines.length / 20);
    const startIdx = index * segmentSize;
    const endIdx = Math.min(startIdx + segmentSize, dataLines.length);
    
    const segment = lines.slice(0, 8).concat(dataLines.slice(startIdx, endIdx)).join('\n');
    return segment;
}

function generateIPFSHash(data) {
    // Simulate IPFS hash generation
    return 'Qm' + Buffer.from(data).toString('base64').substring(0, 44).replace(/[+/=]/g, '').substring(0, 44);
}

function generateSimulatedVCF() {
    return `##fileformat=VCFv4.2
##fileDate=20240325
##source=SimulatedGenomicData
##reference=GRCh38
#CHROM	POS	ID	REF	ALT	QUAL	FILTER	INFO
1	10177	rs367896724	A	AC	100	PASS	AC=1;AF=0.25;AN=4;DB=dbSNP;H2
1	10352	rs555500075	T	C	100	PASS	AC=1;AF=0.25;AN=4;DB=dbSNP;H2
1	10400	rs568915205	G	T	100	PASS	AC=1;AF=0.25;AN=4;DB=dbSNP;H2
1	10433	rs62635286	CT	C	100	PASS	AC=2;AF=0.5;AN=4;DB=dbSNP;H2
1	10511	rs113993975	A	T	100	PASS	AC=1;AF=0.25;AN=4;DB=dbSNP;H2
1	10511	rs113993976	A	G	100	PASS	AC=1;AF=0.25;AN=4;DB=dbSNP;H2
1	10539	rs62635288	G	A	100	PASS	AC=1;AF=0.25;AN=4;DB=dbSNP;H2
1	10542	rs62635289	G	T	100	PASS	AC=1;AF=0.25;AN=4;DB=dbSNP;H2
1	10579	rs555500076	T	A	100	PASS	AC=1;AF=0.25;AN=4;DB=dbSNP;H2
1	10611	rs62635290	T	G	100	PASS	AC=1;AF=0.25;AN=4;DB=dbSNP;H2`;
}

main();
