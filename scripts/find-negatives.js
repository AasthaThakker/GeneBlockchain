const mongoose = require('mongoose');
require('dotenv').config();

const RegistrationRequestSchema = new mongoose.Schema({
    proposalId: Number,
    applicantAddress: String,
    email: String
});

async function findNegatives() {
    try {
        await mongoose.connect(process.env.DATABASE_URL);
        console.log("Connected to MongoDB.");

        const RegistrationRequest = mongoose.models.RegistrationRequest || mongoose.model('RegistrationRequest', RegistrationRequestSchema);

        const results = await RegistrationRequest.find({ proposalId: -1 });
        console.log(`\nFound ${results.length} records with proposalId: -1`);
        results.forEach(r => console.log(`- ${r.applicantAddress} (${r.email})`));

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await mongoose.connection.close();
    }
}

findNegatives();
