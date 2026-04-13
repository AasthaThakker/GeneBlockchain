const { ethers } = require("ethers");

async function checkContractDeployment() {
    try {
        console.log("=== Contract Deployment Check ===");
        
        // Connect to Ganache
        const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545");
        const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
        
        console.log("Checking contract at:", contractAddress);
        
        // Check if there's any code at the contract address
        const code = await provider.getCode(contractAddress);
        console.log("Contract bytecode length:", code.length);
        console.log("Contract bytecode:", code.substring(0, 100) + (code.length > 100 ? "..." : ""));
        
        if (code === "0x") {
            console.log("NO CONTRACT FOUND at this address!");
            console.log("The contract needs to be deployed.");
            
            // Check what accounts exist on Ganache
            console.log("\n=== Available Ganache Accounts ===");
            for (let i = 0; i < 5; i++) {
                try {
                    const signer = await provider.getSigner(i);
                    const address = await signer.getAddress();
                    const balance = await provider.getBalance(address);
                    console.log(`Account ${i}: ${address} (Balance: ${ethers.formatEther(balance)} ETH)`);
                } catch (error) {
                    console.log(`Account ${i}: Error getting address`);
                }
            }
        } else {
            console.log("Contract FOUND at this address!");
            
            // Try to get the latest block
            try {
                const latestBlock = await provider.getBlockNumber();
                console.log("Latest block number:", latestBlock);
            } catch (error) {
                console.log("Error getting block number:", error.message);
            }
        }
        
    } catch (error) {
        console.error("Failed to check contract deployment:", error);
    }
}

checkContractDeployment().then(() => {
    console.log("\n=== Check complete ===");
    process.exit(0);
}).catch(error => {
    console.error("Script failed:", error);
    process.exit(1);
});
