const mongoose = require('mongoose');
require('dotenv').config();

async function checkRecords() {
    try {
        await mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/genomic-data-platform');
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('genomicrecords'); // Mongoose pluralizes and lowercases by default

        const records = await collection.find({}).toArray();
        console.log(`Found ${records.length} records in genomicrecords collection:`);

        records.forEach(r => {
            console.log(JSON.stringify({
                recordId: r.recordId,
                pid: r.pid,
                labId: r.labId,
                labName: r.labName,
                ipfsCID: r.ipfsCID,
                uploadDate: r.uploadDate
            }, null, 2));
        });

    } catch (error) {
        console.error('Error checking records:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkRecords();
