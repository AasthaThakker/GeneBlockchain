require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

async function checkExistingData() {
    await mongoose.connect('mongodb://localhost:27017/genomic-data-platform');
    const db = mongoose.connection.db;
    
    const count = await db.collection('blockchaintransactions').countDocuments({ operationType: { $exists: true } });
    console.log('Transactions with operationType:', count);
    
    await mongoose.disconnect();
}

checkExistingData();
