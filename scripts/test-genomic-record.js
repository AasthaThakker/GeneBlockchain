const { getGenomicRecord, genomicRecordExists } = require('./lib/blockchain');

async function testGenomicRecord() {
    try {
        console.log("=== Test Genomic Record Retrieval ===\n");
        
        // Test record 0
        console.log("Testing record 0:");
        const exists0 = await genomicRecordExists(0);
        console.log("  Record 0 exists:", exists0);
        
        if (exists0) {
            const record0 = await getGenomicRecord(0);
            console.log("  Record 0 data:", {
                pid: record0.pid,
                fileHash: record0.fileHash,
                fileId: record0.fileId,
                registeredBy: record0.registeredBy,
                timestamp: record0.timestamp
            });
        }
        
        // Test record 1
        console.log("\nTesting record 1:");
        const exists1 = await genomicRecordExists(1);
        console.log("  Record 1 exists:", exists1);
        
        if (exists1) {
            const record1 = await getGenomicRecord(1);
            console.log("  Record 1 data:", {
                pid: record1.pid,
                fileHash: record1.fileHash,
                fileId: record1.fileId,
                registeredBy: record1.registeredBy,
                timestamp: record1.timestamp
            });
        }
        
    } catch (error) {
        console.error('Error testing genomic record:', error);
    }
}

testGenomicRecord().then(() => {
    console.log('\n=== Test complete ===');
    process.exit(0);
}).catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
});
