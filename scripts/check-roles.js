const { ethers } = require('ethers');

// Contract ABI (just the functions we need)
const CONTRACT_ABI = [
    "function roles(address) external view returns (uint8)",
    "function memberCount(uint8) external view returns (uint256)",
    "function proposalCount() external view returns (uint256)"
];

async function checkRoles() {
    try {
        // Connect to the local Hardhat node
        const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
        const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
        const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, provider);

        console.log('Checking roles in deployed contract...\n');

        // Get the deployer account (server account)
        const [deployer, patient, lab, researcher] = await provider.listAccounts();
        
        console.log('Accounts and their roles:');
        console.log(`Deployer/Server: ${deployer}`);
        console.log(`Patient: ${patient}`);
        console.log(`Lab: ${lab}`);
        console.log(`Researcher: ${researcher}\n`);

        // Check roles for each account
        const accounts = [
            { name: 'Deployer/Server', address: deployer },
            { name: 'Patient', address: patient },
            { name: 'Lab', address: lab },
            { name: 'Researcher', address: researcher }
        ];

        for (const account of accounts) {
            const role = await contract.roles(account.address);
            const roleName = getRoleName(Number(role));
            console.log(`${account.name} (${account.address}): Role = ${roleName} (${role})`);
        }

        console.log('\nMember counts:');
        console.log(`None (0): ${await contract.memberCount(0)}`);
        console.log(`Patient (1): ${await contract.memberCount(1)}`);
        console.log(`Lab (2): ${await contract.memberCount(2)}`);
        console.log(`Researcher (3): ${await contract.memberCount(3)}`);

        console.log(`\nTotal proposals: ${await contract.proposalCount()}`);

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

checkRoles();
