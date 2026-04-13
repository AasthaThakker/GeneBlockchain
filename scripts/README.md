# Scripts Directory

This directory contains utility scripts for blockchain operations, testing, and data management.

## Core Scripts (Keep)

### Deployment & Contract Management
- `deploy-contract.js` - Deploy GenShareRegistry contract
- `deploy.js` - Alternative deployment script

### Verification & Testing
- `verify-contract.js` - Verify contract deployment and basic functions
- `decode-blockchain-tx.js` - Decode blockchain transaction data

## Utility Scripts (Review Before Removal)

### Data Analysis & Export
- `analyze-blockchain-activity.js` - Analyze blockchain activity
- `export-blockchain-data.js` - Export blockchain data to JSON
- `read-blockchain-data.js` - Read blockchain data
- `dump-raw-blockchain.js` - Dump raw blockchain data

### Testing & Debugging
- `check-blockchain-data.js` - Check blockchain data integrity
- `check-contract-deployment.js` - Verify contract deployment
- `test-genomic-record.js` - Test genomic record operations
- `verify-live-data.js` - Verify live data

### Data Management
- `clean-registrations.js` - Clean up registration data
- `fix-database-indices.js` - Fix database indices
- `clear-blockchain-refs.js` - Clear blockchain references

### Role Management
- `assign-server-role.js` - Assign server roles
- `set-admin.js` - Set admin permissions

### Demo & Examples
- `live-data-demo.js` - Live data demonstration
- `file-access-demo.js` - File access demonstration
- `simple-ipfs-check.js` - Simple IPFS verification

## Analysis Scripts (Consider Removing)

These scripts appear to be for specific analysis tasks and may not be needed for regular operations:
- `correct-block-analysis.js`
- `final-block-analysis.js`
- `fix-block-analysis.js`
- `load-test-latency.js`
- `view-genomic-data.js`
- `find-user-by-pid.js`
- `find-negatives.js`
- `check-stored-data.js`
- `debug-registration-api.js`
- `clear-and-register.js`
- `verify-registration.js`
- `start-hardhat.js`
- `seed-simple.js`

## Recommendations

1. **Keep Core Scripts**: Maintain deployment, verification, and decoding scripts
2. **Review Utility Scripts**: Keep only those regularly used for operations
3. **Remove Analysis Scripts**: Most analysis scripts appear to be one-time utilities
4. **Consolidate Similar Functions**: Multiple scripts do similar operations (checking, verifying, analyzing)

## Usage

All scripts use centralized utilities from `lib/blockchain-utils.ts` and `lib/contract-abi.ts` to reduce code duplication.
