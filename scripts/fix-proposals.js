const mongoose = require('mongoose');
const path = require('path');

// Set up module resolution for TypeScript files
require('module').registerExtensions('.ts', (module, filename) => {
    const content = require('fs').readFileSync(filename, 'utf8');
    module._compile(content, filename);
});

// Import the compiled models
const { RegistrationRequest } = require('../lib/models/RegistrationRequest');
const { proposeRegistrationOnChain } = require('../lib/blockchain');

require('dotenv').config();

async function fixInvalidProposals() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.DATABASE_URL);
        console.log('Connected to MongoDB');

        // Find all requests with proposalId: -1
        const invalidRequests = await RegistrationRequest.find({ proposalId: -1 });
        console.log(`Found ${invalidRequests.length} requests with invalid proposalId`);

        for (const request of invalidRequests) {
            console.log(`Fixing request for ${request.name} (${request.applicantAddress})`);
            
            try {
                // Role enum: Lab = 2, Researcher = 3
                const roleEnum = request.role === 'LAB' ? 2 : 3;
                
                // Create new proposal on-chain
                const proposalResult = await proposeRegistrationOnChain(
                    request.applicantAddress,
                    roleEnum,
                    7 // 7 days voting
                );

                // Update the request with the new proposalId
                request.proposalId = proposalResult.proposalId;
                request.status = proposalResult.autoApproved ? 'approved' : 'pending';
                request.txHash = proposalResult.txHash;
                
                await request.save();
                
                console.log(`✅ Fixed: proposalId=${proposalResult.proposalId}, status=${request.status}`);
            } catch (error) {
                console.error(`❌ Failed to fix request for ${request.name}:`, error.message);
            }
        }

        console.log('Fix completed');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixInvalidProposals();
