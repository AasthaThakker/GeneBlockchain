# Encryption Setup Guide

## Overview
The system now uses AES-256 encryption for file storage with SHA-256 hash verification. Files are stored locally in MongoDB instead of IPFS.

## Environment Variables

Add the following to your `.env` file:

```bash
# Encryption Key (64-character hex string for AES-256)
# Generate with: openssl rand -hex 32
ENCRYPTION_KEY=your_64_character_hex_key_here

# Existing blockchain variables
NEXT_PUBLIC_CONTRACT_ADDRESS=your_contract_address
RPC_URL=http://127.0.0.1:8545
HARDHAT_PRIVATE_KEY=your_private_key
```

## Generate Encryption Key

### Method 1: Using OpenSSL (Recommended)
```bash
openssl rand -hex 32
```

### Method 2: Using Node.js
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Security Notes

1. **Key Management**: Store the ENCRYPTION_KEY securely. If lost, encrypted files cannot be decrypted.
2. **Key Rotation**: Changing the key will make existing encrypted files inaccessible.
3. **Backup**: Maintain secure backups of your encryption key.

## File Storage Changes

### Previous System (IPFS)
- Files stored on IPFS network
- IPFS CID stored on blockchain
- Hash verification only

### New System (Local MongoDB)
- Files encrypted with AES-256 and stored in MongoDB
- Unique file ID stored on blockchain
- SHA-256 hash used for integrity verification
- Local and blockchain integrity checks

## API Changes

### New Endpoints
- `POST /api/files` - Upload encrypted files
- `GET /api/files` - List files with metadata
- `GET /api/files/[fileId]` - Download decrypted files
- `DELETE /api/files/[fileId]` - Delete files
- `POST /api/verify` - Verify file integrity
- `GET /api/verify` - Get files for verification

### Updated Endpoints
- `/api/genomic-records` - Now uses encrypted file storage
- `/api/lab/integrity` - Updated verification UI

## Smart Contract Changes

### Updated Functions
- `registerGenomicData(pid, fileHash, fileId)` - Removed IPFS CID parameter
- `getGenomicRecord(index)` - Returns fileId instead of ipfsCID
- `verifyIntegrity(index, fileHash)` - Unchanged, still uses SHA-256

### Updated Events
- `GenomicDataRegistered` - Now emits fileId instead of ipfsCID

## Verification Process

1. **Local Verification**: Decrypt file and compare SHA-256 hash
2. **Blockchain Verification**: Compare on-chain hash with current hash
3. **Dual Verification**: Both local and blockchain must pass

## Migration Steps

1. Deploy updated smart contract
2. Set ENCRYPTION_KEY in environment
3. Update application code
4. Migrate existing data (if needed)
5. Test file upload and verification

## Testing

```bash
# Test file upload
curl -X POST http://localhost:3000/api/files \
  -F "file=@test.vcf" \
  -F "pid=PATIENT001" \
  -F "labId=LAB001" \
  -F "labName=Test Lab"

# Test verification
curl -X POST http://localhost:3000/api/verify \
  -H "Content-Type: application/json" \
  -d '{"fileId": "FILE_1234567890_ABCDEF123"}'
```
