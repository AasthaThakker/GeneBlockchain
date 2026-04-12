const hre = require("hardhat");

async function main() {
    console.log("Deploying GenShareRegistry to Ganache...\n");

    const GenShareRegistry = await hre.ethers.getContractFactory("GenShareRegistry");
    const registry = await GenShareRegistry.deploy();

    await registry.waitForDeployment();

    const address = await registry.getAddress();
    console.log(`✅ GenShareRegistry deployed to: ${address}`);
    console.log(`\nAdd this to your .env file:`);
    console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`);

    // Register roles for test accounts
    const signers = await hre.ethers.getSigners();
    console.log(`\n? Registering roles for test accounts...`);

    // Account #0 = deployer/owner (used by server)
    console.log(`  Owner/Server: ${signers[0].address}`);

    // Register additional test accounts if available
    if (signers.length > 1) {
        // Account #1 = Patient
        await registry.registerRole(signers[1].address, 1); // Role.Patient
        console.log(`  Patient:      ${signers[1].address}`);
    }
    
    if (signers.length > 2) {
        // Account #2 = Lab
        await registry.registerRole(signers[2].address, 2); // Role.Lab
        console.log(`  Lab:          ${signers[2].address}`);
    }
    
    if (signers.length > 3) {
        // Account #3 = Researcher
        await registry.registerRole(signers[3].address, 3); // Role.Researcher
        console.log(`  Researcher:   ${signers[3].address}`);
    }
    
    if (signers.length === 1) {
        console.log(`  Note: Only 1 account available. Additional test accounts not registered.`);
    }

    console.log(`\n🚀 Deployment complete!`);
    console.log(`\nNext steps:`);
    console.log(`  1. Copy the contract address to .env as NEXT_PUBLIC_CONTRACT_ADDRESS`);
    console.log(`  2. Run 'npm run dev' to start the app`);
    console.log(`  3. Keep the Hardhat node running in a separate terminal`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
