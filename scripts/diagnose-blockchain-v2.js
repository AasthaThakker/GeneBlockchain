const { ethers } = require('ethers');
require('dotenv').config();

async function diagnose() {
    console.log("==========================================");
    console.log("--- Blockchain Configuration Diagnostics ---");
    console.log("==========================================");

    const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545";
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    const privateKey = process.env.HARDHAT_PRIVATE_KEY;

    console.log(`RPC URL:          ${rpcUrl}`);
    console.log(`Contract Address: ${contractAddress}`);
    console.log(`Private Key Set:  ${!!privateKey}`);

    if (!contractAddress) {
        console.error("CRITICAL ERROR: NEXT_PUBLIC_CONTRACT_ADDRESS is not set in .env!");
        process.exit(1);
    }

    if (!ethers.isAddress(contractAddress)) {
        console.error(`ERROR: '${contractAddress}' is NOT a valid Ethereum hex address!`);
    } else {
        console.log("SUCCESS: Contract address format is valid.");
    }

    try {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const network = await provider.getNetwork();
        console.log(`SUCCESS: Connected to network.`);
        console.log(`  - Chain ID: ${network.chainId}`);
        console.log(`  - Name:     ${network.name}`);

        const code = await provider.getCode(contractAddress);
        if (code === "0x") {
            console.error(`\nWARNING: No contract code found at ${contractAddress}.`);
            console.error(`This address does not contain a contract on the current network.`);
            console.error(`Did you restart Hardhat? You likely need to redeploy and update .env.`);
        } else {
            console.log(`SUCCESS: Contract found at ${contractAddress} (${code.length / 2 - 1} bytes).`);
        }

        const blockNumber = await provider.getBlockNumber();
        console.log(`Current Block:    ${blockNumber}`);

        if (privateKey) {
            try {
                const wallet = new ethers.Wallet(privateKey, provider);
                console.log(`Signer Address:   ${wallet.address}`);
                const balance = await provider.getBalance(wallet.address);
                console.log(`Signer Balance:   ${ethers.formatEther(balance)} ETH`);
            } catch (walletErr) {
                console.error(`ERROR: Invalid private key provided in .env`);
            }
        }

    } catch (err) {
        console.error(`\nCRITICAL ERROR: Failed to connect to blockchain at ${rpcUrl}`);
        console.error(`Details: ${err.message}`);
    }
    console.log("==========================================\n");
}

diagnose();
