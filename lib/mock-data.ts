// GenShare Mock Data

export const mockPatient = {
  pid: "PID-7f8a2c",
  walletAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18",
  displayName: "Patient #7f8a2c",
  registeredAt: "2025-12-15T10:30:00Z",
}

export const mockLab = {
  labId: "LAB-001",
  name: "GenoTech Diagnostics",
  email: "admin@genotech.lab",
  walletAddress: "0x8Ba1f109551bD432803012645Ac136ddd64DBA72",
  verificationStatus: true,
}

export const mockResearcher = {
  researcherId: "RES-042",
  name: "Dr. Sarah Chen",
  institution: "Imperial College London",
  email: "s.chen@imperial.ac.uk",
  walletAddress: "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B",
  verificationStatus: true,
}

export interface GenomicRecord {
  id: string
  pid: string
  labId: string
  labName: string
  fileType: "VCF" | "FASTA"
  ipfsCID: string
  fileHash: string
  blockchainTxHash: string
  uploadDate: string
  status: "Registered" | "Pending" | "Verified"
}

export const mockGenomicRecords: GenomicRecord[] = [
  {
    id: "GR-001",
    pid: "PID-7f8a2c",
    labId: "LAB-001",
    labName: "GenoTech Diagnostics",
    fileType: "VCF",
    ipfsCID: "QmX7b3gF9HK2yRfN1vCJpWqLzMa8dPUoWkEXeYpJw4kG5N",
    fileHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    blockchainTxHash: "0x4a8b3f2e1d6c5a7b9e0f2d4c6a8b3f2e1d6c5a7b9e0f2d4c6a8b3f2e1d6c5a7b",
    uploadDate: "2026-01-15T14:30:00Z",
    status: "Verified",
  },
  {
    id: "GR-002",
    pid: "PID-7f8a2c",
    labId: "LAB-001",
    labName: "GenoTech Diagnostics",
    fileType: "FASTA",
    ipfsCID: "QmY8c4hG0IL3zSgO2wDKqMzN9ePVoXlFYqZoAw5kH6lH7P",
    fileHash: "a7ffc6f8bf1ed76651c14756a061d662f580ff4de43b49fa82d80a4b80f8434a",
    blockchainTxHash: "0x5b9c4g3f2e7d6b8c0f1g3e5d7b9c4g3f2e7d6b8c0f1g3e5d7b9c4g3f2e7d6b8c",
    uploadDate: "2026-01-20T09:15:00Z",
    status: "Verified",
  },
  {
    id: "GR-003",
    pid: "PID-7f8a2c",
    labId: "LAB-002",
    labName: "BioVault Labs",
    fileType: "VCF",
    ipfsCID: "QmZ9d5iH1JM4aTgP3xELrNnO0fQWpYmGZrAx6lI7mI8Q",
    fileHash: "b8ggd7g9cg2fe87762d25867b172e773g691gg5ef44c50gb83e91b81g9545b",
    blockchainTxHash: "0x6c0d5h4g3f8e7c9d1g2h4f6e8c0d5h4g3f8e7c9d1g2h4f6e8c0d5h4g3f8e7c9d",
    uploadDate: "2026-02-01T16:45:00Z",
    status: "Registered",
  },
]

export interface AccessRequest {
  id: string
  pid: string
  researcherId: string
  researcherName: string
  institution: string
  genomicRecordId: string
  purpose: string
  durationDays: number
  status: "Pending" | "Approved" | "Rejected"
  blockchainRequestId: string
  requestedAt: string
}

export const mockAccessRequests: AccessRequest[] = [
  {
    id: "AR-001",
    pid: "PID-7f8a2c",
    researcherId: "RES-042",
    researcherName: "Dr. Sarah Chen",
    institution: "Imperial College London",
    genomicRecordId: "GR-001",
    purpose: "Genome-wide association study for Type 2 Diabetes markers",
    durationDays: 90,
    status: "Pending",
    blockchainRequestId: "0xREQ001",
    requestedAt: "2026-02-10T11:00:00Z",
  },
  {
    id: "AR-002",
    pid: "PID-7f8a2c",
    researcherId: "RES-088",
    researcherName: "Prof. James Wright",
    institution: "MIT Broad Institute",
    genomicRecordId: "GR-002",
    purpose: "Pharmacogenomics research for personalized drug response prediction",
    durationDays: 60,
    status: "Pending",
    blockchainRequestId: "0xREQ002",
    requestedAt: "2026-02-12T09:30:00Z",
  },
  {
    id: "AR-003",
    pid: "PID-7f8a2c",
    researcherId: "RES-015",
    researcherName: "Dr. Aisha Patel",
    institution: "Stanford Genomics Lab",
    genomicRecordId: "GR-001",
    purpose: "Rare disease variant identification in South Asian populations",
    durationDays: 120,
    status: "Approved",
    blockchainRequestId: "0xREQ003",
    requestedAt: "2026-01-25T14:00:00Z",
  },
]

export interface Consent {
  id: string
  pid: string
  researcherId: string
  researcherName: string
  institution: string
  genomicRecordId: string
  consentStart: string
  consentEnd: string
  status: "Active" | "Revoked" | "Expired"
  blockchainTxHash: string
}

export const mockConsents: Consent[] = [
  {
    id: "CON-001",
    pid: "PID-7f8a2c",
    researcherId: "RES-015",
    researcherName: "Dr. Aisha Patel",
    institution: "Stanford Genomics Lab",
    genomicRecordId: "GR-001",
    consentStart: "2026-01-26T00:00:00Z",
    consentEnd: "2026-05-26T00:00:00Z",
    status: "Active",
    blockchainTxHash: "0xCON001TX",
  },
  {
    id: "CON-002",
    pid: "PID-7f8a2c",
    researcherId: "RES-023",
    researcherName: "Dr. Liam Nakamura",
    institution: "University of Tokyo",
    genomicRecordId: "GR-002",
    consentStart: "2025-11-01T00:00:00Z",
    consentEnd: "2026-01-01T00:00:00Z",
    status: "Expired",
    blockchainTxHash: "0xCON002TX",
  },
]

export interface AuditEvent {
  id: string
  timestamp: string
  action: string
  actor: string
  actorRole: "Patient" | "Lab" | "Researcher" | "System"
  target: string
  txHash: string
  details: string
}

export const mockAuditEvents: AuditEvent[] = [
  {
    id: "AE-001",
    timestamp: "2026-02-15T10:30:00Z",
    action: "DataAccessed",
    actor: "RES-015",
    actorRole: "Researcher",
    target: "GR-001",
    txHash: "0xAUDIT001",
    details: "Dr. Aisha Patel accessed genomic record GR-001 under consent CON-001",
  },
  {
    id: "AE-002",
    timestamp: "2026-02-12T09:30:00Z",
    action: "AccessRequested",
    actor: "RES-088",
    actorRole: "Researcher",
    target: "GR-002",
    txHash: "0xAUDIT002",
    details: "Prof. James Wright requested access to genomic record GR-002",
  },
  {
    id: "AE-003",
    timestamp: "2026-02-10T11:00:00Z",
    action: "AccessRequested",
    actor: "RES-042",
    actorRole: "Researcher",
    target: "GR-001",
    txHash: "0xAUDIT003",
    details: "Dr. Sarah Chen requested access to genomic record GR-001",
  },
  {
    id: "AE-004",
    timestamp: "2026-02-01T16:45:00Z",
    action: "GenomicDataRegistered",
    actor: "LAB-002",
    actorRole: "Lab",
    target: "GR-003",
    txHash: "0xAUDIT004",
    details: "BioVault Labs uploaded VCF file for PID-7f8a2c",
  },
  {
    id: "AE-005",
    timestamp: "2026-01-26T00:00:00Z",
    action: "ConsentGranted",
    actor: "PID-7f8a2c",
    actorRole: "Patient",
    target: "CON-001",
    txHash: "0xAUDIT005",
    details: "Patient granted 120-day consent to Dr. Aisha Patel for GR-001",
  },
  {
    id: "AE-006",
    timestamp: "2026-01-20T09:15:00Z",
    action: "GenomicDataRegistered",
    actor: "LAB-001",
    actorRole: "Lab",
    target: "GR-002",
    txHash: "0xAUDIT006",
    details: "GenoTech Diagnostics uploaded FASTA file for PID-7f8a2c",
  },
  {
    id: "AE-007",
    timestamp: "2026-01-15T14:30:00Z",
    action: "GenomicDataRegistered",
    actor: "LAB-001",
    actorRole: "Lab",
    target: "GR-001",
    txHash: "0xAUDIT007",
    details: "GenoTech Diagnostics uploaded VCF file for PID-7f8a2c",
  },
  {
    id: "AE-008",
    timestamp: "2025-12-15T10:30:00Z",
    action: "PatientRegistered",
    actor: "PID-7f8a2c",
    actorRole: "System",
    target: "PID-7f8a2c",
    txHash: "0xAUDIT008",
    details: "Patient PID-7f8a2c registered via MetaMask wallet connection",
  },
]

// Additional mock data for researcher search
export interface SearchableRecord {
  id: string
  pid: string
  fileType: "VCF" | "FASTA"
  uploadDate: string
  tags: string[]
  status: "Available" | "Consent Required"
}

export const mockSearchableRecords: SearchableRecord[] = [
  {
    id: "GR-001",
    pid: "PID-7f8a2c",
    fileType: "VCF",
    uploadDate: "2026-01-15",
    tags: ["Whole Genome", "South Asian", "Type 2 Diabetes"],
    status: "Available",
  },
  {
    id: "GR-002",
    pid: "PID-7f8a2c",
    fileType: "FASTA",
    uploadDate: "2026-01-20",
    tags: ["Exome", "Pharmacogenomics"],
    status: "Consent Required",
  },
  {
    id: "GR-004",
    pid: "PID-3e9b1d",
    fileType: "VCF",
    uploadDate: "2026-01-10",
    tags: ["Whole Genome", "European", "Cardiovascular"],
    status: "Consent Required",
  },
  {
    id: "GR-005",
    pid: "PID-5c2f8a",
    fileType: "FASTA",
    uploadDate: "2026-02-05",
    tags: ["Exome", "East Asian", "Rare Disease"],
    status: "Consent Required",
  },
  {
    id: "GR-006",
    pid: "PID-1d7e4b",
    fileType: "VCF",
    uploadDate: "2026-02-08",
    tags: ["Whole Genome", "African", "Oncology"],
    status: "Available",
  },
]
