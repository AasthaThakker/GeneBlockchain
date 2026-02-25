const mongoose = require('mongoose');
const { ethers } = require('ethers');
require('dotenv').config();

// Minimal ABI for RegistrationProposed event
const CONTRACT_ABI = [
    "event RegistrationProposed(uint256 indexed proposalId, address indexed applicant, uint8 requestedRole, uint256 deadline)",
    "function proposalCount() external view returns (uint256)"
];

async function fixNegatives() {
    try {
        await mongoose.connect(process.env.DATABASE_URL);
        console.log("Connected to MongoDB.");

        const registrationRequestSchema = new mongoose.Schema({
            applicantAddress: String,
            proposalId: Number,
            txHash: String,
            role: String,
            email: String
        }, { collection: 'registrationrequests' });

        const RegistrationRequest = mongoose.models.RegistrationRequest || mongoose.model('RegistrationRequest', registrationRequestSchema);

        const invalidRequests = await RegistrationRequest.find({ proposalId: -1 });
        console.log(`Found ${invalidRequests.length} requests with proposalId: -1`);

        if (invalidRequests.length === 0) return;

        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || "http://127.0.0.1:8545");
        const contract = new ethers.Contract(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS, CONTRACT_ABI, provider);

        for (const req of invalidRequests) {
            console.log(`\nProcessing: ${req.email} (${req.applicantAddress})`);
            console.log(`TxHash: ${req.txHash}`);

            try {
                const receipt = await provider.getTransactionReceipt(req.txHash);
                if (!receipt) {
                    console.log(`  [!] Transaction receipt not found. Transaction might not be on this chain.`);
                    continue;
                }

                let foundId = -1;
                for (const log of receipt.logs) {
                    try {
                        const parsedLog = contract.interface.parseLog({
                            topics: [...log.topics],
                            data: log.data
                        });

                        if (parsedLog?.name === "RegistrationProposed") {
                            foundId = Number(parsedLog.args.proposalId);
                            break;
                        }
                    } catch (e) { continue; }
                }

                if (foundId !== -1) {
                    req.proposalId = foundId;
                    await req.save();
                    console.log(`  [OK] Updated proposalId to: ${foundId}`);
                } else {
                    console.log(`  [!] Event not found in tx logs.`);
                }
            } catch (err) {
                console.error(`  [ERR] Error processing tx: ${err.message}`);
            }
        }

    } catch (err) {
        console.error("Critical Error:", err.message);
    } finally {
        await mongoose.connection.close();
    }
}

fixNegatives();
