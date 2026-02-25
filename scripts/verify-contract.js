const { ethers } = require('ethers');
require('dotenv').config();

const CONTRACT_ABI = [
    "function proposalCount() external view returns (uint256)",
    "function memberCount(uint8) external view returns (uint256)",
    "function roles(address) external view returns (uint8)",
    "function getProposal(uint256) external view returns (address, uint8, uint256, uint256, uint256, uint8)"
];

async function main() {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || "http://127.0.0.1:8545");
    const contract = new ethers.Contract(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS, CONTRACT_ABI, provider);

    try {
        const count = await contract.proposalCount();
        console.log("Proposal Count:", count.toString());

        const labCount = await contract.memberCount(2);
        console.log("Lab Member Count:", labCount.toString());

        const resCount = await contract.memberCount(3);
        console.log("Researcher Member Count:", resCount.toString());

        if (count > 0n) {
            const p = await contract.getProposal(0);
            console.log("Proposal #0:", p);
        }
    } catch (err) {
        console.error("Error calling contract:", err.message);
        if (err.data) console.error("Error data:", err.data);
    }
}

main();
