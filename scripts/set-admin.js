const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const DATABASE_URL = process.env.DATABASE_URL || "mongodb://localhost:27017/genomic-data-platform";

async function makeAdmin() {
    try {
        await mongoose.connect(DATABASE_URL);
        console.log('Connected to MongoDB');

        const walletAddress = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'.toLowerCase();

        // Update or create user record
        const User = mongoose.connection.collection('users');

        const result = await User.updateOne(
            { walletAddress, role: 'LAB' },
            {
                $set: {
                    isAdmin: true,
                    labId: 'LAB-001',
                    displayName: 'Main Lab Admin (MetaMask)',
                    email: 'admin@genometech.com'
                }
            },
            { upsert: true }
        );

        console.log(`Success! User ${walletAddress} is now an Admin for LAB-001.`);
        console.log('Modified count:', result.modifiedCount);
        console.log('Upserted count:', result.upsertedCount);

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

makeAdmin();
