const { ethers } = require('ethers');
require('dotenv').config();

async function diagnose() {
    console.log("--- Blockchain Configuration Diagnostics ---");

    const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545";
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    const privateKey = process.env.HARDHAT_PRIVATE_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

    console.log(`RPC URL: ${rpcUrl}`);
    console.log(`Contract Address: ${contractAddress}`);

    if (!contractAddress) {
        console.error("ERROR: NEXT_PUBLIC_CONTRACT_ADDRESS is not set!");
        return;
    }

    if (!ethers.isAddress(contractAddress)) {
        console.error(`ERROR: '${contractAddress}' is NOT a valid Ethereum address!`);
    } else {
        console.log("SUCCESS: Contract address format is valid.");
    }

    try {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const network = await provider.getNetwork();
        console.log(`SUCCESS: Connected to network. Chain ID: ${network.chainId}, Name: ${network.name}`);

        const code = await provider.getCode(contractAddress);
        if (code === "0x") {
            console.error(`WARNING: No contract code found at address ${contractAddress}. Has it been deployed to this network?`);
        } else {
            console.log(`SUCCESS: Contract code found at ${contractAddress} (${(code.length - 2) / 2} bytes).`);
        }

    } catch (err) {
        console.error(`ERROR: Failed to connect to blockchain at ${rpcUrl}`);
        console.error(err.message);
    }
}

diagnose();
