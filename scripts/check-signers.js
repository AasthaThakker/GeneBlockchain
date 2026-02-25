const hre = require("hardhat");

async function checkSigners() {
    const signers = await hre.ethers.getSigners();
    const target = "0xdf57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e".toLowerCase();

    console.log("Checking Hardhat Signers...");
    for (let i = 0; i < signers.length; i++) {
        if (signers[i].address.toLowerCase() === target) {
            console.log(`MATCH found: Signer #${i} ADDRESS matches the target.`);
        }
    }
    console.log("No address matches found in first 20 signers.");
    console.log("Note: This script cannot check private keys easily as they are typically derived from a mnemonic in Hardhat.");
}

checkSigners().catch(err => console.error(err));
