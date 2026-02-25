const hre = require("hardhat");

async function main() {
    const accounts = await hre.ethers.getSigners();
    console.log("Hardhat Accounts:");
    for (let i = 0; i < 20; i++) {
        const addr = accounts[i].address;
        const pid = "PID-" + addr.slice(2, 8);
        console.log(`${i}: ${addr} -> ${pid}`);
    }
}

main().catch(console.error);
