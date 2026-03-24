const { proposeRegistrationOnChain } = require('./lib/blockchain');

async function testProposalFix() {
    console.log('🧪 Testing Proposal ID Fix');
    
    try {
        // Test registration proposal
        const result = await proposeRegistrationOnChain(
            '0xTestAddress1234567890123456789012345678901234567890',
            2, // LAB role
            7  // 7 days voting
        );
        
        console.log('✅ Proposal Result:', {
            txHash: result.txHash,
            proposalId: result.proposalId,
            autoApproved: result.autoApproved
        });
        
        if (result.proposalId >= 0) {
            console.log('🎉 SUCCESS: Proposal ID is valid:', result.proposalId);
        } else {
            console.log('❌ ISSUE: Proposal ID is still -1');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testProposalFix();
