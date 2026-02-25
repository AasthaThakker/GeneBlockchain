const mongoose = require('mongoose');
require('dotenv').config();

const ConsentSchema = new mongoose.Schema({ pid: String, status: String, consentId: String });

async function listConsents() {
    try {
        await mongoose.connect(process.env.DATABASE_URL);
        const Consent = mongoose.models.Consent || mongoose.model('Consent', ConsentSchema);
        const all = await Consent.find({}).lean();
        all.forEach(c => {
            console.log(`ID: ${c.consentId} | PID: ${c.pid} | Status: ${c.status}`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.connection.close();
    }
}

listConsents();
