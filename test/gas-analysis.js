const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GenShareRegistry Gas Usage Tests", function () {
  let contract;
  let owner, researcher, patient;

  beforeEach(async function () {
    [owner, researcher, patient] = await ethers.getSigners();
    
    const GenShareRegistry = await ethers.getContractFactory("GenShareRegistry");
    contract = await GenShareRegistry.deploy();
    // No need to call .deployed() in newer Hardhat versions
  });

  describe("Gas Usage Analysis", function () {
    it("Should report gas for registerGenomicData", async function () {
      const pid = "PATIENT_001";
      const fileHash = "0x1234567890abcdef1234567890abcdef12345678";
      const ipfsCID = "QmTest1234567890abcdef";
      
      const tx = await contract.registerGenomicData(pid, fileHash, ipfsCID);
      const receipt = await tx.wait();
      
      console.log(`\n🧬 registerGenomicData Gas Usage:`);
      console.log(`   Gas Used: ${receipt.gasUsed.toString()}`);
      console.log(`   Transaction Hash: ${tx.hash}`);
      console.log(`   Block Number: ${receipt.blockNumber}`);
      
      expect(receipt.gasUsed).to.be.gt(0);
    });

    it("Should report gas for grantConsent", async function () {
      // First register some data
      const pid = "PATIENT_002";
      const fileHash = "0x1234567890abcdef1234567890abcdef12345678";
      const ipfsCID = "QmTest1234567890abcdef";
      
      await contract.registerGenomicData(pid, fileHash, ipfsCID);
      
      // Now grant consent
      const researcherAddr = researcher.address;
      const recordIndex = 0;
      const durationDays = 30;
      
      const tx = await contract.grantConsent(pid, researcherAddr, recordIndex, durationDays);
      const receipt = await tx.wait();
      
      console.log(`\n✅ grantConsent Gas Usage:`);
      console.log(`   Gas Used: ${receipt.gasUsed.toString()}`);
      console.log(`   Transaction Hash: ${tx.hash}`);
      console.log(`   Block Number: ${receipt.blockNumber}`);
      
      expect(receipt.gasUsed).to.be.gt(0);
    });

    it("Should report gas for logAccess", async function () {
      // First register data and grant consent
      const pid = "PATIENT_003";
      const fileHash = "0x1234567890abcdef1234567890abcdef12345678";
      const ipfsCID = "QmTest1234567890abcdef";
      
      await contract.registerGenomicData(pid, fileHash, ipfsCID);
      await contract.grantConsent(pid, researcher.address, 0, 30);
      
      // Now log access
      const researcherAddr = researcher.address;
      const recordIndex = 0;
      const consentIndex = 0;
      
      const tx = await contract.logAccess(pid, researcherAddr, recordIndex, consentIndex);
      const receipt = await tx.wait();
      
      console.log(`\n🔑 logAccess Gas Usage:`);
      console.log(`   Gas Used: ${receipt.gasUsed.toString()}`);
      console.log(`   Transaction Hash: ${tx.hash}`);
      console.log(`   Block Number: ${receipt.blockNumber}`);
      
      expect(receipt.gasUsed).to.be.gt(0);
    });

    it("Should report gas for verifyIntegrity", async function () {
      // First register some data
      const pid = "PATIENT_004";
      const fileHash = "0x1234567890abcdef1234567890abcdef12345678";
      const ipfsCID = "QmTest1234567890abcdef";
      
      await contract.registerGenomicData(pid, fileHash, ipfsCID);
      
      // Now verify integrity - this is a view function, so we need to call it differently
      const recordIndex = 0;
      const originalHash = fileHash;
      
      // For view functions, use call() instead of sending transaction
      const result = await contract.verifyIntegrity(recordIndex, originalHash);
      
      console.log(`\n🔍 verifyIntegrity Gas Usage:`);
      console.log(`   Function Type: View (no transaction)`);
      console.log(`   Record Index: ${recordIndex}`);
      console.log(`   Original Hash: ${originalHash.substring(0, 20)}...`);
      console.log(`   Result: ${result}`);
      
      expect(result).to.be.a('boolean');
    });

    it("Should provide comprehensive gas analysis", async function () {
      console.log(`\n📊 COMPREHENSIVE GAS ANALYSIS REPORT`);
      console.log(`====================================`);
      
      const operations = [
        {
          name: "registerGenomicData",
          func: () => contract.registerGenomicData("TEST_001", "0x1234567890abcdef1234567890abcdef12345678", "QmTest1234567890abcdef")
        },
        {
          name: "grantConsent", 
          func: async () => {
            await contract.registerGenomicData("TEST_002", "0x1234567890abcdef1234567890abcdef12345678", "QmTest1234567890abcdef");
            return contract.grantConsent("TEST_002", researcher.address, 0, 30);
          }
        },
        {
          name: "logAccess",
          func: async () => {
            await contract.registerGenomicData("TEST_003", "0x1234567890abcdef1234567890abcdef12345678", "QmTest1234567890abcdef");
            await contract.grantConsent("TEST_003", researcher.address, 0, 30);
            return contract.logAccess("TEST_003", researcher.address, 0, 0);
          }
        },
        {
          name: "verifyIntegrity",
          func: async () => {
            await contract.registerGenomicData("TEST_004", "0x1234567890abcdef1234567890abcdef12345678", "QmTest1234567890abcdef");
            // This is a view function, so we simulate a transaction for gas estimation
            const result = await contract.verifyIntegrity.estimateGas(0, "0x1234567890abcdef1234567890abcdef12345678");
            return { gasUsed: result.toString(), hash: "0xviewfunction" };
          }
        }
      ];

      const results = [];
      
      for (const operation of operations) {
        const result = await operation.func();
        
        let gasUsed, costETH, txHash;
        
        if (typeof result === 'object' && result.gasUsed) {
          // View function result
          gasUsed = Number(result.gasUsed);
          costETH = 0; // View functions don't cost gas
          txHash = result.hash;
        } else {
          // Regular transaction
          const receipt = await result.wait();
          gasUsed = Number(receipt.gasUsed.toString());
          const gasPrice = Number(receipt.gasPrice?.toString() || '0');
          costETH = (gasUsed * gasPrice) / 1e18;
          txHash = result.hash;
        }
        
        results.push({
          name: operation.name,
          gasUsed,
          costETH,
          txHash
        });
        
        console.log(`${operation.name}:`);
        console.log(`  Gas Used: ${gasUsed.toLocaleString()}`);
        console.log(`  Cost: ${costETH.toFixed(8)} ETH`);
        console.log(`  Hash: ${txHash.substring(0, 10)}...`);
        console.log('');
      }

      // Summary statistics
      const totalGas = results.reduce((sum, r) => sum + r.gasUsed, 0);
      const avgGas = totalGas / results.length;
      const maxGas = Math.max(...results.map(r => r.gasUsed));
      const minGas = Math.min(...results.map(r => r.gasUsed));
      
      console.log(`📈 SUMMARY STATISTICS:`);
      console.log(`   Total Gas Used: ${totalGas.toLocaleString()}`);
      console.log(`   Average Gas: ${Math.round(avgGas).toLocaleString()}`);
      console.log(`   Max Gas: ${maxGas.toLocaleString()} (${results.find(r => r.gasUsed === maxGas).name})`);
      console.log(`   Min Gas: ${minGas.toLocaleString()} (${results.find(r => r.gasUsed === minGas).name})`);
      console.log(`   Total Cost: ${results.reduce((sum, r) => sum + r.costETH, 0).toFixed(8)} ETH`);
      
      // Store results in MongoDB for IEEE analysis
      try {
        const mongoose = require('mongoose');
        await mongoose.connect('mongodb://localhost:27017/genomic-data-platform');
        
        const db = mongoose.connection.db;
        await db.collection('gas-analysis-tests').insertOne({
          testType: 'COMPREHENSIVE_GAS_ANALYSIS',
          timestamp: new Date(),
          results: results,
          summary: {
            totalGas,
            avgGas,
            maxGas,
            minGas,
            totalCost: results.reduce((sum, r) => sum + r.costETH, 0)
          },
          networkId: 'localhost',
          createdAt: new Date()
        });
        
        console.log(`\n💾 Gas analysis results stored in MongoDB`);
        await mongoose.disconnect();
      } catch (error) {
        console.log(`\n⚠️  Could not store results in MongoDB: ${error.message}`);
      }
    });
  });
});
