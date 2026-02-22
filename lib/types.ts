// Shared TypeScript interfaces for GenShare platform

export interface GenomicRecord {
  _id?: string
  recordId: string
  pid: string
  labId: string
  labName: string
  fileType: "VCF" | "FASTA"
  ipfsCID: string
  fileHash: string
  blockchainTxHash: string
  uploadDate: string
  status: "Registered" | "Pending" | "Verified"
  tags?: string[]
}

export interface AccessRequest {
  _id?: string
  requestId: string
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

export interface Consent {
  _id?: string
  consentId: string
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

export interface AuditEvent {
  _id?: string
  eventId: string
  timestamp: string
  action: string
  actor: string
  actorRole: "Patient" | "Lab" | "Researcher" | "System"
  target: string
  txHash: string
  details: string
}

export interface SearchableRecord {
  _id?: string
  id: string
  pid: string
  fileType: "VCF" | "FASTA"
  uploadDate: string
  tags: string[]
  status: string
}

export interface UserProfile {
  _id?: string
  email?: string
  role: "PATIENT" | "LAB" | "RESEARCHER"
  walletAddress: string
  isAdmin: boolean
  displayName?: string
  pid?: string
  labId?: string
  labName?: string
  researcherId?: string
  institution?: string
  createdAt?: string
}
