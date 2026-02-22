require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ===== Schema Definitions =====

const userSchema = new mongoose.Schema({
  email: { type: String, sparse: true, lowercase: true, trim: true },
  password: { type: String },
  role: { type: String, enum: ['PATIENT', 'LAB', 'RESEARCHER'], required: true },
  walletAddress: { type: String, required: true, lowercase: true },
  isAdmin: { type: Boolean, default: false },
  displayName: { type: String },
  pid: { type: String },
  labId: { type: String },
  researcherId: { type: String },
}, { timestamps: true });
userSchema.index({ walletAddress: 1, role: 1 }, { unique: true });
userSchema.index({ email: 1, role: 1 }, { sparse: true });

const labSchema = new mongoose.Schema({
  labId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String },
  walletAddress: { type: String, lowercase: true },
  verificationStatus: { type: String, default: 'Verified' },
}, { timestamps: true });

const researcherSchema = new mongoose.Schema({
  researcherId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  institution: { type: String, required: true },
  email: { type: String },
  walletAddress: { type: String, lowercase: true },
  verificationStatus: { type: String, default: 'Verified' },
}, { timestamps: true });

const genomicRecordSchema = new mongoose.Schema({
  recordId: { type: String, required: true, unique: true },
  pid: { type: String, required: true },
  labId: { type: String, required: true },
  labName: { type: String, required: true },
  fileType: { type: String, enum: ['VCF', 'FASTA'], required: true },
  ipfsCID: { type: String, required: true },
  fileHash: { type: String, required: true },
  blockchainTxHash: { type: String, required: true },
  uploadDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['Registered', 'Pending', 'Verified'], default: 'Verified' },
  tags: [{ type: String }],
}, { timestamps: true });

const accessRequestSchema = new mongoose.Schema({
  requestId: { type: String, required: true, unique: true },
  pid: { type: String, required: true },
  researcherId: { type: String, required: true },
  researcherName: { type: String, required: true },
  institution: { type: String, required: true },
  genomicRecordId: { type: String, required: true },
  purpose: { type: String, required: true },
  durationDays: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  blockchainRequestId: { type: String },
  requestedAt: { type: Date, default: Date.now },
}, { timestamps: true });

const consentSchema = new mongoose.Schema({
  consentId: { type: String, required: true, unique: true },
  pid: { type: String, required: true },
  researcherId: { type: String, required: true },
  researcherName: { type: String, required: true },
  institution: { type: String, required: true },
  genomicRecordId: { type: String, required: true },
  consentStart: { type: Date, required: true },
  consentEnd: { type: Date, required: true },
  status: { type: String, enum: ['Active', 'Revoked', 'Expired'], default: 'Active' },
  blockchainTxHash: { type: String },
}, { timestamps: true });

const auditEventSchema = new mongoose.Schema({
  eventId: { type: String, required: true, unique: true },
  timestamp: { type: Date, default: Date.now },
  action: { type: String, required: true },
  actor: { type: String, required: true },
  actorRole: { type: String, enum: ['Patient', 'Lab', 'Researcher', 'System'], required: true },
  target: { type: String },
  txHash: { type: String },
  details: { type: String },
}, { timestamps: true });

// ===== Create Models =====
const User = mongoose.model('User', userSchema);
const Lab = mongoose.model('Lab', labSchema);
const Researcher = mongoose.model('Researcher', researcherSchema);
const GenomicRecord = mongoose.model('GenomicRecord', genomicRecordSchema);
const AccessRequest = mongoose.model('AccessRequest', accessRequestSchema);
const Consent = mongoose.model('Consent', consentSchema);
const AuditEvent = mongoose.model('AuditEvent', auditEventSchema);

const MONGODB_URL = process.env.DATABASE_URL || 'mongodb://localhost:27017/genomic-data-platform';

// ===== Seed Data =====

async function seedDatabase() {
  try {
    await mongoose.connect(MONGODB_URL);
    console.log('Connected to MongoDB');

    // Clear all collections
    await Promise.all([
      User.deleteMany({}),
      Lab.deleteMany({}),
      Researcher.deleteMany({}),
      GenomicRecord.deleteMany({}),
      AccessRequest.deleteMany({}),
      Consent.deleteMany({}),
      AuditEvent.deleteMany({}),
    ]);
    console.log('Cleared existing data');

    // Drop stale indexes from old schema (email_1, walletAddress_1 unique indexes)
    try {
      const userCollection = mongoose.connection.collection('users');
      await userCollection.dropIndexes();
      console.log('Dropped old User indexes');
    } catch (e) {
      console.log('No old indexes to drop (or collection does not exist yet)');
    }

    // ===== Create Lab Organizations =====
    const labs = await Lab.insertMany([
      { labId: 'LAB-001', name: 'GenomeTech Labs', email: 'lab1@genomics.com', walletAddress: '0x9876543210987654321098765432109876543210', verificationStatus: 'Verified' },
      { labId: 'LAB-002', name: 'BioSequence Inc', email: 'lab2@genomics.com', walletAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', verificationStatus: 'Verified' },
      { labId: 'LAB-003', name: 'NeuroClinical Lab', email: 'lab3@genomics.com', walletAddress: '0x1111111111111111111111111111111111111111', verificationStatus: 'Pending' },
    ]);
    console.log(`Created ${labs.length} lab organizations`);

    // ===== Create Researcher Profiles =====
    const researchers = await Researcher.insertMany([
      { researcherId: 'RES-001', name: 'Dr. Alice Chen', institution: 'MIT Genomics Lab', email: 'researcher1@university.edu', walletAddress: '0x2222222222222222222222222222222222222222', verificationStatus: 'Verified' },
      { researcherId: 'RES-002', name: 'Dr. Bob Kumar', institution: 'Stanford Medical', email: 'researcher2@university.edu', walletAddress: '0x3333333333333333333333333333333333333333', verificationStatus: 'Verified' },
      { researcherId: 'RES-003', name: 'Dr. Carol Williams', institution: 'Johns Hopkins Research', email: 'researcher3@university.edu', walletAddress: '0x4444444444444444444444444444444444444444', verificationStatus: 'Pending' },
    ]);
    console.log(`Created ${researchers.length} researcher profiles`);

    // ===== Create Users =====
    const hashedLabPassword = await bcrypt.hash('lab123', 10);
    const hashedResearcherPassword = await bcrypt.hash('research123', 10);

    const users = await User.insertMany([
      // Patients (MetaMask only)
      { walletAddress: '0x742d35cc6634c0532925a3b844bc9e7595f2bd18', role: 'PATIENT', pid: 'PID-742d35', displayName: 'Patient Alpha' },
      { walletAddress: '0x8ba1f109551bd432803012645ac136ddd64dba72', role: 'PATIENT', pid: 'PID-8ba1f1', displayName: 'Patient Beta' },
      { walletAddress: '0xab5801a7d398351b8be11c439e05c5b3259aec9b', role: 'PATIENT', pid: 'PID-Ab5801', displayName: 'Patient Gamma' },
      // Lab Admin
      { walletAddress: '0x9876543210987654321098765432109876543210', role: 'LAB', email: 'lab1@genomics.com', password: hashedLabPassword, isAdmin: true, labId: 'LAB-001', displayName: 'GenomeTech Admin' },
      // Lab Users
      { walletAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', role: 'LAB', email: 'lab2@genomics.com', password: hashedLabPassword, isAdmin: false, labId: 'LAB-002', displayName: 'BioSequence User' },
      { walletAddress: '0x1111111111111111111111111111111111111111', role: 'LAB', email: 'lab3@genomics.com', password: hashedLabPassword, isAdmin: false, labId: 'LAB-003', displayName: 'NeuroClinical User' },
      // Researcher Admin
      { walletAddress: '0x2222222222222222222222222222222222222222', role: 'RESEARCHER', email: 'researcher1@university.edu', password: hashedResearcherPassword, isAdmin: true, researcherId: 'RES-001', displayName: 'Dr. Alice Chen' },
      // Researcher Users
      { walletAddress: '0x3333333333333333333333333333333333333333', role: 'RESEARCHER', email: 'researcher2@university.edu', password: hashedResearcherPassword, isAdmin: false, researcherId: 'RES-002', displayName: 'Dr. Bob Kumar' },
      { walletAddress: '0x4444444444444444444444444444444444444444', role: 'RESEARCHER', email: 'researcher3@university.edu', password: hashedResearcherPassword, isAdmin: false, researcherId: 'RES-003', displayName: 'Dr. Carol Williams' },
    ]);
    console.log(`Created ${users.length} users`);

    // ===== Create Genomic Records =====
    const genomicRecords = await GenomicRecord.insertMany([
      {
        recordId: 'GR-001', pid: 'PID-742d35', labId: 'LAB-001', labName: 'GenomeTech Labs',
        fileType: 'VCF', ipfsCID: 'QmXnNyG1c4hG0IL3zSgO2wDKqMzN9ePnVHYB8c4hG0IL3z',
        fileHash: 'a1b2c3d4e5f6789012345678901234567890abcdef01234567890abcdef012345',
        blockchainTxHash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
        uploadDate: new Date('2024-11-15'), status: 'Verified',
        tags: ['Oncology', 'Whole Genome', 'South Asian'],
      },
      {
        recordId: 'GR-002', pid: 'PID-742d35', labId: 'LAB-002', labName: 'BioSequence Inc',
        fileType: 'FASTA', ipfsCID: 'QmYpOpH2d5I1JM4tAgP3xELrNsO0fQoWJZC5d5I1JM4tAg',
        fileHash: 'b2c3d4e5f6789012345678901234567890abcdef01234567890abcdef01234567',
        blockchainTxHash: '0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c',
        uploadDate: new Date('2024-12-01'), status: 'Verified',
        tags: ['Exome', 'Pharmacogenomics'],
      },
      {
        recordId: 'GR-003', pid: 'PID-8ba1f1', labId: 'LAB-001', labName: 'GenomeTech Labs',
        fileType: 'VCF', ipfsCID: 'QmZqRsI3e6J2KN5uBhQ4yFMsOtP1gRpXKAD6e6J2KN5uBh',
        fileHash: 'c3d4e5f6789012345678901234567890abcdef01234567890abcdef0123456789',
        blockchainTxHash: '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d',
        uploadDate: new Date('2025-01-10'), status: 'Registered',
        tags: ['Cardiology', 'Targeted Panel'],
      },
    ]);
    console.log(`Created ${genomicRecords.length} genomic records`);

    // ===== Create Access Requests =====
    const accessRequests = await AccessRequest.insertMany([
      {
        requestId: 'AR-001', pid: 'PID-742d35', researcherId: 'RES-001',
        researcherName: 'Dr. Alice Chen', institution: 'MIT Genomics Lab',
        genomicRecordId: 'GR-001', purpose: 'Oncology biomarker discovery research',
        durationDays: 180, status: 'Approved',
        blockchainRequestId: '0xreq1a2b3c', requestedAt: new Date('2024-11-20'),
      },
      {
        requestId: 'AR-002', pid: 'PID-742d35', researcherId: 'RES-002',
        researcherName: 'Dr. Bob Kumar', institution: 'Stanford Medical',
        genomicRecordId: 'GR-002', purpose: 'Pharmacogenomics population study',
        durationDays: 365, status: 'Pending',
        blockchainRequestId: '0xreq2b3c4d', requestedAt: new Date('2025-01-05'),
      },
      {
        requestId: 'AR-003', pid: 'PID-8ba1f1', researcherId: 'RES-001',
        researcherName: 'Dr. Alice Chen', institution: 'MIT Genomics Lab',
        genomicRecordId: 'GR-003', purpose: 'Cardiovascular genetics comparison study',
        durationDays: 90, status: 'Pending',
        blockchainRequestId: '0xreq3c4d5e', requestedAt: new Date('2025-01-15'),
      },
      {
        requestId: 'AR-004', pid: 'PID-742d35', researcherId: 'RES-003',
        researcherName: 'Dr. Carol Williams', institution: 'Johns Hopkins Research',
        genomicRecordId: 'GR-001', purpose: 'Pan-cancer genome analysis',
        durationDays: 270, status: 'Rejected',
        blockchainRequestId: '0xreq4d5e6f', requestedAt: new Date('2024-12-10'),
      },
    ]);
    console.log(`Created ${accessRequests.length} access requests`);

    // ===== Create Consents =====
    const consentsData = await Consent.insertMany([
      {
        consentId: 'CON-001', pid: 'PID-742d35', researcherId: 'RES-001',
        researcherName: 'Dr. Alice Chen', institution: 'MIT Genomics Lab',
        genomicRecordId: 'GR-001',
        consentStart: new Date('2024-11-25'), consentEnd: new Date('2025-05-25'),
        status: 'Active', blockchainTxHash: '0xcon1a2b3c4d5e6f',
      },
      {
        consentId: 'CON-002', pid: 'PID-742d35', researcherId: 'RES-002',
        researcherName: 'Dr. Bob Kumar', institution: 'Stanford Medical',
        genomicRecordId: 'GR-002',
        consentStart: new Date('2024-10-01'), consentEnd: new Date('2024-12-31'),
        status: 'Expired', blockchainTxHash: '0xcon2b3c4d5e6f7a',
      },
    ]);
    console.log(`Created ${consentsData.length} consents`);

    // ===== Create Audit Events =====
    const auditEvents = await AuditEvent.insertMany([
      {
        eventId: 'AE-001', timestamp: new Date('2024-11-15T10:30:00Z'),
        action: 'GenomicDataRegistered', actor: 'LAB-001', actorRole: 'Lab',
        target: 'GR-001', txHash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
        details: 'GenomeTech Labs registered VCF file for PID-742d35',
      },
      {
        eventId: 'AE-002', timestamp: new Date('2024-11-20T14:00:00Z'),
        action: 'AccessRequested', actor: 'RES-001', actorRole: 'Researcher',
        target: 'GR-001', txHash: '0xreq1a2b3c',
        details: 'Dr. Alice Chen requested access to dataset GR-001',
      },
      {
        eventId: 'AE-003', timestamp: new Date('2024-11-25T09:15:00Z'),
        action: 'ConsentGranted', actor: 'PID-742d35', actorRole: 'Patient',
        target: 'GR-001', txHash: '0xcon1a2b3c4d5e6f',
        details: 'Patient granted consent to Dr. Alice Chen for dataset GR-001',
      },
      {
        eventId: 'AE-004', timestamp: new Date('2024-12-01T11:00:00Z'),
        action: 'GenomicDataRegistered', actor: 'LAB-002', actorRole: 'Lab',
        target: 'GR-002', txHash: '0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c',
        details: 'BioSequence Inc registered FASTA file for PID-742d35',
      },
      {
        eventId: 'AE-005', timestamp: new Date('2024-12-10T16:30:00Z'),
        action: 'DataAccessed', actor: 'RES-001', actorRole: 'Researcher',
        target: 'GR-001', txHash: '0xacc1a2b3c4d5e6f',
        details: 'Dr. Alice Chen accessed dataset GR-001 for oncology research',
      },
      {
        eventId: 'AE-006', timestamp: new Date('2025-01-05T13:45:00Z'),
        action: 'AccessRequested', actor: 'RES-002', actorRole: 'Researcher',
        target: 'GR-002', txHash: '0xreq2b3c4d',
        details: 'Dr. Bob Kumar requested access to dataset GR-002',
      },
      {
        eventId: 'AE-007', timestamp: new Date('2025-01-10T08:00:00Z'),
        action: 'GenomicDataRegistered', actor: 'LAB-001', actorRole: 'Lab',
        target: 'GR-003', txHash: '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d',
        details: 'GenomeTech Labs registered VCF file for PID-8ba1f1',
      },
      {
        eventId: 'AE-008', timestamp: new Date('2025-01-15T10:00:00Z'),
        action: 'ConsentRevoked', actor: 'PID-742d35', actorRole: 'Patient',
        target: 'GR-002', txHash: '0xrev1a2b3c4d5e6f',
        details: 'Patient revoked consent for dataset GR-002 (expired)',
      },
    ]);
    console.log(`Created ${auditEvents.length} audit events`);

    // ===== Summary =====
    console.log('\n✅ Database seeded successfully!\n');
    console.log('📊 Summary:');
    console.log(`  Lab Organizations: ${labs.length}`);
    console.log(`  Researcher Profiles: ${researchers.length}`);
    console.log(`  Users: ${users.length} (3 patients, 3 lab, 3 researcher)`);
    console.log(`  Genomic Records: ${genomicRecords.length}`);
    console.log(`  Access Requests: ${accessRequests.length}`);
    console.log(`  Consents: ${consentsData.length}`);
    console.log(`  Audit Events: ${auditEvents.length}`);

    console.log('\n🔑 Login Credentials:');
    console.log('  Patients: Connect MetaMask with any of these addresses:');
    console.log('    0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18');
    console.log('    0x8ba1f109551bD432803012645Ac136ddd64DBA72');
    console.log('    0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B');
    console.log('  Labs (email/password OR MetaMask):');
    console.log('    lab1@genomics.com / lab123 (Admin)');
    console.log('    lab2@genomics.com / lab123');
    console.log('    lab3@genomics.com / lab123');
    console.log('  Researchers (email/password OR MetaMask):');
    console.log('    researcher1@university.edu / research123 (Admin)');
    console.log('    researcher2@university.edu / research123');
    console.log('    researcher3@university.edu / research123');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
  }
}

seedDatabase();
