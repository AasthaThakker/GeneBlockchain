const mongoose = require('mongoose');

// Simple MongoDB connection and update
async function fixInvalidProposals() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.DATABASE_URL);
        console.log('Connected to MongoDB');

        // Define the schema inline to avoid import issues
        const registrationRequestSchema = new mongoose.Schema({
            applicantAddress: String,
            role: String,
            name: String,
            email: String,
            password: String,
            institution: String,
            proposalId: Number,
            status: String,
            txHash: String,
            votes: [{
                voter: String,
                approve: Boolean,
                txHash: String,
                timestamp: Date
            }],
            expiresAt: Date
        }, { collection: 'registrationrequests' });

        const RegistrationRequest = mongoose.model('RegistrationRequest', registrationRequestSchema);

        // Find all requests with proposalId: -1
        const invalidRequests = await RegistrationRequest.find({ proposalId: -1 });
        console.log(`Found ${invalidRequests.length} requests with invalid proposalId`);

        // Simply delete these invalid requests so users can re-register
        const result = await RegistrationRequest.deleteMany({ proposalId: -1 });
        console.log(`Deleted ${result.deletedCount} invalid registration requests`);

        console.log('Users will need to re-register to create valid proposals');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

require('dotenv').config();
fixInvalidProposals();
