const mongoose = require('mongoose');
require('dotenv').config();

const ConsentSchema = new mongoose.Schema({}, { strict: false });

async function dumpConsents() {
    try {
        await mongoose.connect(process.env.DATABASE_URL);
        const Consent = mongoose.model('Consent', ConsentSchema, 'consents');
        const all = await Consent.find({}).lean();
        console.log(JSON.stringify(all, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.connection.close();
    }
}

dumpConsents();
