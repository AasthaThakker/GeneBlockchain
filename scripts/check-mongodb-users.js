const mongoose = require('mongoose');
require('dotenv').config();

async function checkUsers() {
    try {
        await mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/genomic-data-platform');
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const users = await db.collection('users').find({}).toArray();
        console.log(`Found ${users.length} users:`);

        users.forEach(u => {
            console.log(JSON.stringify({
                _id: u._id,
                email: u.email,
                walletAddress: u.walletAddress,
                role: u.role,
                labId: u.labId,
                pid: u.pid
            }, null, 2));
        });

    } catch (error) {
        console.error('Error checking users:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkUsers();
