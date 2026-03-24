# Smart Contracts Documentation - GeneBlockchain Platform

## Overview

The GeneBlockchain platform utilizes a single, comprehensive smart contract called **GenShareRegistry** that serves as the core blockchain component for the genomic data sharing ecosystem. This contract is written in Solidity and deployed on a local Hardhat Ethereum network for development and testing purposes.

## Primary Smart Contract

### GenShareRegistry.sol

**File Location:** `contracts/GenShareRegistry.sol`  
**Solidity Version:** `^0.8.20`  
**License:** MIT  
**Deployment:** Local Hardhat Network (http://127.0.0.1:8545)

#### Contract Purpose

The GenShareRegistry contract implements a blockchain-based genomic data sharing platform with four core features designed to ensure security, privacy, and auditability:

1. **Genomic Hash Registry** - Immutable storage of file hashes and IPFS references
2. **Dynamic Consent Engine** - Time-bound, revocable patient consent management
3. **Access Logging** - On-chain audit trail with consent validation
4. **Role Registry** - Decentralized identity with role-based permissions

#### Key Design Principles

- **Privacy-First:** Only de-identified patient IDs (PIDs), cryptographic hashes, and consent logic are stored on-chain. No personally identifiable information (PII) is stored on the blockchain.
- **Immutability:** All registered data, consents, and access logs are permanently recorded and cannot be altered.
- **Transparency:** All operations emit events that can be monitored by authorized parties.

## Core Components

### 1. Role Registry System

**Purpose:** Manage user roles and permissions within the platform.

#### Roles Defined:
```solidity
enum Role { None, Patient, Lab, Researcher }
```

#### Key Functions:
- `registerRole(address _account, Role _role)` - Owner-only role assignment
- Role tracking with member counts per role
- Role-based access control modifiers

#### Events:
- `RoleRegistered(address indexed account, Role role)`

### 2. Registration Voting System

**Purpose:** Decentralized onboarding of new Labs and Researchers through community voting.

#### Key Functions:
- `proposeRegistration(address _applicant, Role _role, uint256 _votingDays)` - Submit registration proposal
- `voteOnRegistration(uint256 _proposalId, bool _approve, address _voter)` - Vote on proposals
- `finalizeRegistration(uint256 _proposalId)` - Finalize after voting deadline

#### Voting Mechanics:
- Majority approval (>50%) required
- Time-bound voting windows
- Bootstrap mechanism: First member of each role is auto-approved
- Existing members of the same role can vote on new applicants

#### Events:
- `RegistrationProposed`, `RegistrationVoted`, `RegistrationApproved`, `RegistrationRejected`

### 3. Genomic Hash Registry

**Purpose:** Immutable storage of genomic data references for integrity verification.

#### Data Structure:
```solidity
struct GenomicRecord {
    string pid;           // De-identified Patient ID
    string fileHash;      // SHA-256 hash of genomic file
    string ipfsCID;       // IPFS Content Identifier
    address registeredBy; // Lab wallet address
    uint256 timestamp;
    bool exists;
}
```

#### Key Functions:
- `registerGenomicData(string _pid, string _fileHash, string _ipfsCID)` - Register new genomic data
- `verifyIntegrity(uint256 _recordIndex, string _fileHash)` - Verify file integrity
- `getGenomicRecord(uint256 _index)` - Retrieve record details

#### Events:
- `GenomicDataRegistered`

### 4. Dynamic Consent Engine

**Purpose:** Patient-controlled, time-bound access permissions for genomic data.

#### Consent Structure:
```solidity
struct Consent {
    string pid;             // Patient ID
    address researcher;     // Researcher wallet
    uint256 recordIndex;    // Linked genomic record
    uint256 grantedAt;
    uint256 expiresAt;
    bool revoked;
    bool exists;
}
```

#### Key Functions:
- `grantConsent(string _pid, address _researcher, uint256 _recordIndex, uint256 _durationDays)` - Grant access
- `revokeConsent(uint256 _consentIndex)` - Revoke access
- `isConsentActive(uint256 _consentIndex)` - Check consent validity

#### Events:
- `ConsentGranted`, `ConsentRevoked`

### 5. Access Logging System

**Purpose:** Immutable audit trail of all data access attempts with on-chain consent validation.

#### Key Functions:
- `logAccess(string _pid, address _researcher, uint256 _recordIndex, uint256 _consentIndex)` - Log access attempt

#### Validation Logic:
The contract validates consent before allowing access:
- Consent exists and is not revoked
- Consent has not expired
- Researcher address matches the consent
- Record index matches the consent

#### Events:
- `DataAccessed` - Successful access with consent validation
- `AccessDenied` - Failed access with reason (expired, revoked, mismatched, etc.)

## Technical Specifications

### Gas Optimization
- Solidity 0.8.20 with optimizer enabled (200 runs)
- Efficient storage patterns with struct packing
- Event emissions for off-chain data retrieval

### Security Features
- Role-based access control throughout
- Input validation on all functions
- Reentrancy protection patterns
- Owner-only administrative functions

### Privacy Protection
- No PII stored on-chain
- Only cryptographic hashes and identifiers
- Patient consent required for all access
- Immutable audit trail

## Deployment Configuration

### Hardhat Configuration
```javascript
module.exports = {
    solidity: {
        version: "0.8.20",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    networks: {
        localhost: {
            url: "http://127.0.0.1:8545",
        },
    },
};
```

### Deployment Process
1. Contract compilation using Hardhat
2. Deployment to local Hardhat node
3. Automatic role registration for test accounts:
   - Account #0: Owner/Server (deployer)
   - Account #1: Patient
   - Account #2: Lab
   - Account #3: Researcher

### Integration Points

#### Frontend Integration
- Contract address stored in environment variable (`NEXT_PUBLIC_CONTRACT_ADDRESS`)
- Ethers.js library for blockchain interaction
- MetaMask integration for user authentication

#### Backend Integration
- Server-side contract interactions for administrative functions
- IPFS integration for file storage
- MongoDB for off-chain metadata storage

#### API Integration
- RESTful API endpoints proxy blockchain interactions
- Event monitoring for real-time updates
- Consistency validation between on-chain and off-chain data

## Usage Patterns

### Typical Workflow

1. **Lab Registration:**
   - Lab submits registration proposal
   - Existing lab members vote on approval
   - Upon approval, lab role is assigned on-chain

2. **Genomic Data Upload:**
   - Lab encrypts and uploads file to IPFS
   - File hash and IPFS CID registered on-chain
   - Immutable record created with timestamp

3. **Researcher Access Request:**
   - Researcher requests access to specific genomic data
   - Patient grants time-bound consent via smart contract
   - Consent recorded immutably on-chain

4. **Data Access:**
   - Researcher attempts to access data
   - Smart contract validates consent on-chain
   - Access logged immutably with success/failure status

5. **Audit & Compliance:**
   - All access events logged on blockchain
   - Consent history tracked immutably
   - Data integrity verifiable through hash comparison

## Benefits of Smart Contract Implementation

### For Patients
- **Control:** Direct control over data access through consent management
- **Transparency:** Complete visibility into who accessed their data and when
- **Security:** Cryptographic proof of data integrity
- **Revocability:** Ability to revoke consent at any time

### For Labs
- **Immutability:** Tamper-proof proof of data integrity
- **Audit Trail:** Complete record of all data handling activities
- **Compliance:** Automated compliance with data protection regulations
- **Trust:** Enhanced trust through transparent operations

### For Researchers
- **Verification:** Cryptographic verification of data authenticity
- **Audit Trail:** Proof of proper data acquisition and usage
- **Consent Management:** Clear, time-bound access permissions
- **Reproducibility:** Immutable record of data sources and access

## Future Enhancements

### Potential Contract Upgrades
- Multi-signature requirements for sensitive operations
- Tiered consent levels (different data access permissions)
- Automated consent expiry notifications
- Integration with other blockchain networks

### Scalability Considerations
- Layer 2 solutions for reduced gas costs
- Data availability optimizations
- Cross-chain interoperability
- Batch operations for multiple records

## Conclusion

The GenShareRegistry smart contract serves as the foundational trust layer for the GeneBlockchain platform, enabling secure, transparent, and patient-controlled genomic data sharing. By leveraging blockchain's immutability and smart contract automation, the platform ensures data integrity, consent compliance, and comprehensive audit trails while maintaining strict privacy protections.

The contract's modular design allows for future enhancements while maintaining backward compatibility, making it a robust foundation for the evolving field of genomic data sharing and research collaboration.
