const { ethers } = require('ethers');

// Contract ABI
const CONTRACT_ABI = [
    "function registerRole(address _account, uint8 _role) external",
    "function roles(address) external view returns (uint8)"
];

async function assignServerRole() {
    try {
        // Connect to the local Hardhat node with the deployer account
        const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545";
        const privateKey = process.env.HARDHAT_PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
        
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const signer = new ethers.Wallet(privateKey, provider);
        
        const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
        const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);

        const serverAddress = signer.address;
        console.log(`Server address: ${serverAddress}`);

        // Check current role
        const currentRole = await contract.roles(serverAddress);
        console.log(`Current role: ${getRoleName(Number(currentRole))} (${currentRole})`);

        if (Number(currentRole) !== 0) {
            console.log('Server already has a role assigned');
            return;
        }

        // Assign Lab role (2) to server so it can vote on Lab registrations
        console.log('Assigning Lab role to server...');
        const tx = await contract.registerRole(serverAddress, 2); // 2 = Lab
        await tx.wait();
        
        console.log('✅ Server now has Lab role and can vote on Lab registrations');

        // Verify the role was assigned
        const newRole = await contract.roles(serverAddress);
        console.log(`New role: ${getRoleName(Number(newRole))} (${newRole})`);

    } catch (error) {
        console.error('Error:', error.message);
    }
}

function getRoleName(roleNumber) {
    switch (roleNumber) {
        case 0: return 'None';
        case 1: return 'Patient';
        case 2: return 'Lab';
        case 3: return 'Researcher';
        default: return 'Unknown';
    }
}

require('dotenv').config();
assignServerRole();
