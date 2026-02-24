const mongoose = require('mongoose');
const { ethers } = require('ethers');
require('dotenv').config();

// ABI for GenShareRegistry
const CONTRACT_ABI = [
    "function memberCount(uint8) external view returns (uint256)",
    "function proposalCount() external view returns (uint256)",
    "function getProposal(uint256 _proposalId) external view returns (address applicant, uint8 requestedRole, uint256 approveCount, uint256 rejectCount, uint256 deadline, uint8 status)",
    "function roles(address) external view returns (uint8)"
];

const registrationRequestSchema = new mongoose.Schema({
    proposalId: Number,
    status: String,
    votes: Array
});
const RegistrationRequest = mongoose.models.RegistrationRequest || mongoose.model('RegistrationRequest', registrationRequestSchema);

async function diagnose() {
    try {
        console.log('--- 1. Blockchain State ---');
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || "http://127.0.0.1:8545");
        const contract = new ethers.Contract(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS, CONTRACT_ABI, provider);

        const labCount = await contract.memberCount(2); // Role.Lab
        const resCount = await contract.memberCount(3); // Role.Researcher
        const totalProposals = await contract.proposalCount();

        console.log(`Lab Member Count: ${labCount}`);
        console.log(`Researcher Member Count: ${resCount}`);
        console.log(`Total Proposals: ${totalProposals}`);

        for (let i = 0; i < totalProposals; i++) {
            const p = await contract.getProposal(i);
            console.log(`Proposal #${i}: Applicant=${p[0]}, Role=${p[1]}, Approved=${p[2]}, Rejected=${p[3]}, Status=${p[5]}`);
        }

        console.log('\n--- 2. MongoDB State ---');
        await mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/genomic-data-platform');
        const requests = await RegistrationRequest.find({});
        console.log(`Found ${requests.length} registration requests in DB:`);
        requests.forEach(r => {
            console.log(`DB Proposal #${r.proposalId}: Status=${r.status}, VotesCount=${r.votes.length}`);
        });

    } catch (error) {
        console.error('Diagnosis failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

diagnose();
