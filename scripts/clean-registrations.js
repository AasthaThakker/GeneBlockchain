const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Basic .env parser
function loadEnv() {
    const envPath = path.join(__dirname, '../.env');
    if (fs.existsSync(envPath)) {
        const env = fs.readFileSync(envPath, 'utf8');
        env.split('\n').forEach(line => {
            const match = line.match(/^([^=#]+)=["']?([^"'\s]+)["']?/);
            if (match) {
                process.env[match[1]] = match[2];
            }
        });
    }
}

loadEnv();

async function fixRegistrationIndexes() {
    try {
        const dbUrl = process.env.DATABASE_URL || 'mongodb://localhost:27017/genomic-data-platform';
        console.log(`Connecting to ${dbUrl}...`);
        await mongoose.connect(dbUrl);
        console.log('Connected.');

        const collectionName = 'registrationrequests';
        const collection = mongoose.connection.collection(collectionName);

        console.log('Clearing records with proposalId: -1...');
        const deleteResult = await collection.deleteMany({ proposalId: -1 });
        console.log(`Deleted ${deleteResult.deletedCount} records.`);

        // Force drop index if it exists and is not partial
        try {
            console.log('Dropping proposalId index to ensure it is recreated correctly...');
            await collection.dropIndex('proposalId_1');
            console.log('Index dropped.');
        } catch (e) {
            console.log('Index did not exist or already dropped.');
        }

        console.log('Cleanup complete.');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixRegistrationIndexes();
