const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying GenShareRegistry contract...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

  const GenShareRegistry = await ethers.getContractFactory("GenShareRegistry");
  const genShareRegistry = await GenShareRegistry.deploy();

  await genShareRegistry.waitForDeployment();
  
  const contractAddress = await genShareRegistry.getAddress();
  console.log("✅ GenShareRegistry deployed to:", contractAddress);
  
  console.log("\n📝 Add this to your .env file:");
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`);
  
  // Register some test roles
  console.log("\n🔐 Registering test roles...");
  
  const addresses = {
    owner: deployer.address,
    patient: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    lab: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    researcher: "0x90F79bf6EB2c4f8703"
  };
  
  try {
    // Register as Patient
    await genShareRegistry.registerRole(addresses.patient, 1); // Patient = 1
    console.log("✅ Patient role registered");
    
    // Register as Lab  
    await genShareRegistry.registerRole(addresses.lab, 2); // Lab = 2
    console.log("✅ Lab role registered");
    
    // Register as Researcher
    await genShareRegistry.registerRole(addresses.researcher, 3); // Researcher = 3
    console.log("✅ Researcher role registered");
    
    console.log("\n🎉 Contract deployment and role setup complete!");
    
  } catch (roleError) {
    console.log("⚠️  Role registration failed (may need voting):", roleError.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
