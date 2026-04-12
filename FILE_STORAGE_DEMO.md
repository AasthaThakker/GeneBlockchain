# Encrypted File Storage Demo

## Overview
This demo shows where encrypted genomic files are stored and how to access them in the GeneBlockchain system.

## Storage Location

### Database Information
- **Database**: `genomic-data-platform`
- **Collection**: `encryptedfiles`
- **Storage Type**: MongoDB (binary data stored directly in database)

### Physical Storage
```
MongoDB Data Files (Windows):
C:\Program Files\MongoDB\Server\X.X\data\genomic-data-platform\*

The files are NOT stored as separate files on disk.
They are stored as encrypted binary data within MongoDB documents.
```

## File Structure in MongoDB

### Sample Document
```javascript
{
  "_id": ObjectId("69d92cd619a40ab424c0ba7e"),
  "fileId": "FILE_1775840469224_56CD24F029E961A7",
  "fileName": "1771999836246_test-sample.vcf",
  "fileType": "VCF",
  "encryptedData": Binary.createFromBase64('KEt39/0VT5HmY1K1NWmOUkvg2FqagEwBn0zmlIyFHCxzT0ztsIobrA2aoOSyUhvLVJ1CXnENxiq9xqSHnX9Ob5yA4wyQUMEISgZH...', 0),
  "iv": Binary.createFromBase64('1nS9NdrMG+Bg3Ut1t8NGOQ==', 0),
  "fileHash": "97819cbc61e954b7137b4ca7d4a58c4057234ccb43c3bef86c436b816863191e",
  "pid": "PID-001",
  "labId": "LAB-001",
  "labName": "GenomeTech Labs",
  "blockchainTxHash": "0xcd633652285a4e736ac76a813e1ecf4c31781e969530f25f7ab6df5467a7cf72",
  "onChainRecordIndex": 0,
  "status": "Registered",
  "tags": [],
  "fileSize": 416,
  "uploadDate": ISODate("2026-04-10T17:01:10.092+00:00"),
  "createdAt": ISODate("2026-04-10T17:01:10.095+00:00"),
  "updatedAt": ISODate("2026-04-10T17:01:10.095+00:00")
}
```

### Key Fields
- **`encryptedData`**: AES-256 encrypted file content (binary)
- **`iv`**: Initialization vector for decryption
- **`fileHash`**: SHA-256 hash for integrity verification
- **`fileId`**: Unique identifier for the file
- **`pid`**: Patient ID for mapping

## How to Access Files

### Method 1: Via API Endpoints

#### Get All Files for a Patient
```bash
curl -X GET "http://localhost:3000/api/files?pid=PID-001"
```

#### Get Specific File by ID
```bash
curl -X GET "http://localhost:3000/api/files/FILE_1775840469224_56CD24F029E961A7"
```

#### Download Decrypted File
```bash
curl -X GET "http://localhost:3000/api/files/FILE_1775840469224_56CD24F029E961A7/download"
```

### Method 2: Direct MongoDB Access

#### Connect to MongoDB
```bash
mongosh genomic-data-platform
```

#### Query Files
```javascript
// Get all files for a patient
db.encryptedfiles.find({ pid: "PID-001" })

// Get specific file by ID
db.encryptedfiles.findOne({ fileId: "FILE_1775840469224_56CD24F029E961A7" })

// Get files by lab
db.encryptedfiles.find({ labId: "LAB-001" })
```

### Method 3: Programmatic Access (Node.js)

#### Access and Decrypt File
```javascript
import connectDB from '@/lib/mongodb'
import { EncryptedFile } from '@/lib/models/EncryptedFile'
import { decrypt } from '@/lib/encryption'
import fs from 'fs'

async function accessFile(fileId) {
  await connectDB()
  
  // 1. Get file from MongoDB
  const file = await EncryptedFile.findOne({ fileId })
  if (!file) {
    throw new Error('File not found')
  }
  
  // 2. Decrypt the file content
  const decryptedContent = decrypt(file.encryptedData, file.iv)
  
  // 3. Save to filesystem
  fs.writeFileSync(`decrypted_${file.fileName}`, decryptedContent)
  
  console.log(`File decrypted and saved as: decrypted_${file.fileName}`)
  return {
    fileName: file.fileName,
    fileSize: file.fileSize,
    decryptedPath: `decrypted_${file.fileName}`
  }
}

// Usage
accessFile('FILE_1775840469224_56CD24F029E961A7')
```

## Encryption Details

### What is a Unique Initialization Vector (IV)?

An **Initialization Vector (IV)** is a random number used to ensure that encrypting the same plaintext multiple times produces different ciphertexts.

#### Purpose in Your System:
In your encrypted file storage, each file gets a **unique IV** for security:

```javascript
// From your MongoDB document
"iv": Binary.createFromBase64('1nS9NdrMG+Bg3Ut1t8NGOQ==', 0)
```

#### Why Unique IV is Critical:

**Security Benefits:**
1. **Prevents Pattern Analysis**: Same file encrypted twice = different ciphertext
2. **Avoids Cryptographic Attacks**: Eliminates predictable patterns
3. **Ensures Uniqueness**: Each encryption operation is unique

**Example:**
```
Same VCF file uploaded twice:

Upload 1:
- IV: 1nS9NdrMG+Bg3Ut1t8NGOQ==
- Ciphertext: KEt39/0VT5HmY1K1NWmOUkvg...

Upload 2: 
- IV: 8xP2qR9sT7uV3wX6yZ1aB4c==
- Ciphertext: 7xQ9wR2sT5uV8yX1zA4bC6d...
```

#### How It Works in Your System:

**1. File Upload Process:**
```javascript
// Each file upload generates a random IV
const iv = crypto.randomBytes(16); // 16 bytes = 128 bits
const encryptedData = encrypt(fileContent, key, iv);
```

**2. Storage in MongoDB:**
```javascript
{
  "fileName": "sample.vcf",
  "encryptedData": Buffer("...encrypted content..."),
  "iv": Buffer("...random 16 bytes..."), // Unique per file
  "fileHash": "..."
}
```

**3. Decryption Process:**
```javascript
// Must use the same IV that was used for encryption
const decryptedContent = decrypt(encryptedData, key, iv);
```

#### Technical Details:

**IV Properties:**
- **Size**: 16 bytes (128 bits) for AES-256-CBC
- **Randomness**: Cryptographically secure random
- **Uniqueness**: Different for each encryption
- **Required**: Must be stored for decryption

**Security Standard:**
- **Never reuse IVs** with the same encryption key
- **Public**: IV can be stored alongside ciphertext
- **Random**: Must be unpredictable

#### Why This Matters:

**Without Unique IV (BAD):**
```
Same file -> Same ciphertext -> Security vulnerability
```

**With Unique IV (GOOD):**
```
Same file -> Different ciphertext each time -> Secure
```

**The unique IV ensures that even identical files uploaded multiple times will have completely different encrypted data in MongoDB, providing maximum security for your genomic data storage.**

### Encryption Process
1. **Original File** (VCF/FASTA) uploaded
2. **Generate Unique IV** - 16 random bytes for this specific file
3. **AES-256 Encryption** using the unique IV
4. **SHA-256 Hash** calculated for integrity verification
5. **Store** encrypted data + IV + hash in MongoDB
6. **Blockchain Reference** created for audit trail

### Decryption Process
1. **Retrieve** encrypted data and IV from MongoDB
2. **Decrypt** using AES-256 with the stored IV
3. **Verify** hash for data integrity
4. **Return** original file content

## Security Features

### Data Protection
- **AES-256 Encryption**: Military-grade encryption
- **Random IV**: Each file has unique initialization vector
- **Hash Verification**: SHA-256 ensures data integrity
- **Blockchain Audit**: All access logged on-chain

### Access Control
- **PID-based Access**: Patients can only access their own files
- **Lab Permissions**: Labs can only access files they uploaded
- **Researcher Access**: Requires patient consent
- **Audit Trail**: All accesses tracked

## Demo Commands

### 1. Check MongoDB Connection
```bash
mongosh --eval "use genomic-data-platform; db.encryptedfiles.countDocuments()"
```

### 2. List All Files
```bash
mongosh --eval "use genomic-data-platform; db.encryptedfiles.find({}, {fileId: 1, fileName: 1, pid: 1, fileSize: 1})"
```

### 3. Check Specific File
```bash
mongosh --eval "use genomic-data-platform; db.encryptedfiles.findOne({fileId: 'FILE_1775840469224_56CD24F029E961A7'})"
```

### 4. Test API Access
```bash
# Start the application
npm run dev

# Test file access in another terminal
curl -X GET "http://localhost:3000/api/files"
```

## File Locations Summary

| Component | Location | Type |
|-----------|----------|------|
| Encrypted Files | MongoDB `encryptedfiles` collection | Binary data |
| File Metadata | MongoDB `encryptedfiles` collection | Document fields |
| Blockchain Records | Ethereum Network | Smart contract |
| Audit Logs | MongoDB `auditEvents` collection | Document |

**Important**: Files are NOT stored as separate files on disk. They are stored as encrypted binary data within MongoDB documents for maximum security.
