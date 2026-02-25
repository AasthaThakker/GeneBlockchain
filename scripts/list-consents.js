const mongoose = require('mongoose');
require('dotenv').config();

const ConsentSchema = new mongoose.Schema({
    consentId: String,
    pid: String,
    researcherName: String,
    status: String
});

async function listConsents() {
    try {
        await mongoose.connect(process.env.DATABASE_URL);
        console.log("Connected to MongoDB.");

        const Consent = mongoose.models.Consent || mongoose.model('Consent', ConsentSchema);

        console.log("\n--- CONSENTS ---");
        const consents = await Consent.find({});
        if (consents.length === 0) {
            console.log("No consents found in database.");
        } else {
            consents.forEach(c => console.log(`- ID: ${c.consentId}, PID: ${c.pid}, Researcher: ${c.researcherName}, Status: ${c.status}`));
        }

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await mongoose.connection.close();
    }
}

listConsents();
