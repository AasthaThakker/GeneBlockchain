const mongoose = require('mongoose');

async function fixProposalIds() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/genomic-data-platform');
        console.log('✅ Connected to MongoDB');

        // Define schema inline to avoid import issues
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
        console.log(`📋 Found ${invalidRequests.length} requests with invalid proposalId`);

        if (invalidRequests.length > 0) {
            // Delete invalid requests so users can re-register
            const result = await RegistrationRequest.deleteMany({ proposalId: -1 });
            console.log(`🗑️  Deleted ${result.deletedCount} invalid registration requests`);
            console.log('💡 Users will need to re-register to create valid proposals');
        } else {
            console.log('✅ No invalid proposal IDs found');
        }

        // Show current status
        const allRequests = await RegistrationRequest.find({});
        console.log(`\n📊 Current Registration Requests:`);
        allRequests.forEach(req => {
            console.log(`   - ${req.name} (${req.role}): proposalId = ${req.proposalId}, status = ${req.status}`);
        });

        await mongoose.disconnect();
        console.log('\n🎉 Fix completed!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

require('dotenv').config();
fixProposalIds();
