const { proposeRegistrationOnChain } = require('../lib/blockchain');
require('dotenv').config();

// Note: This script needs to be run in a context where it can import from lib/blockchain
// Since it's TS, it's easier to create a small .ts file or a simple JS test that uses the API

async function testIncrement() {
    // We'll use the API instead to test the full flow
    const fetch = (await import('node-fetch')).default;

    const testUser = {
        name: "Test Lab " + Date.now(),
        email: "testlab" + Date.now() + "@test.com",
        password: "password123",
        role: "LAB",
        walletAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" // Hardhat #1
    };

    console.log("Registering test user via API...");
    const response = await fetch('http://localhost:3000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser)
    });

    const data = await response.json();
    console.log("Response:", JSON.stringify(data, null, 2));

    if (data.proposalId >= 0) {
        console.log(`✅ Success! Received valid proposalId: ${data.proposalId}`);
    } else {
        console.error(`❌ Failure! Received proposalId: ${data.proposalId}`);
    }
}

testIncrement().catch(console.error);
