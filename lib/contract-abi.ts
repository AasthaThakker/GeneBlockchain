// Centralized Contract ABI for GenShareRegistry
export const CONTRACT_ABI = [
    // Genomic Hash Registry
    "function registerGenomicData(string calldata _pid, string calldata _fileHash, string calldata _fileId) external returns (uint256)",
    "function verifyIntegrity(uint256 _recordIndex, string calldata _fileHash) external view returns (bool matches)",
    "function getGenomicRecord(uint256 _index) external view returns (string pid, string fileHash, string fileId, address registeredBy, uint256 timestamp)",
    "function genomicRecords(uint256) external view returns (string pid, string fileHash, string fileId, address registeredBy, uint256 timestamp, bool exists)",
    "function recordCount() external view returns (uint256)",

    // Dynamic Consent
    "function grantConsent(string calldata _pid, address _researcher, uint256 _recordIndex, uint256 _durationDays) external returns (uint256)",
    "function revokeConsent(uint256 _consentIndex) external",
    "function isConsentActive(uint256 _consentIndex) external view returns (bool)",
    "function getConsent(uint256 _index) external view returns (string pid, address researcher, uint256 recordIndex, uint256 grantedAt, uint256 expiresAt, bool revoked)",
    "function consentCount() external view returns (uint256)",

    // Access Logging
    "function logAccess(string calldata _pid, address _researcher, uint256 _recordIndex, uint256 _consentIndex) external returns (bool)",

    // Role Registry
    "function registerRole(address _account, uint8 _role) external",
    "function roles(address) external view returns (uint8)",
    "function memberCount(uint8) external view returns (uint256)",

    // Registration Voting
    "function proposeRegistration(address _applicant, uint8 _role, uint256 _votingDays) external returns (uint256)",
    "function voteOnRegistration(uint256 _proposalId, bool _approve, address _voter) external",
    "function finalizeRegistration(uint256 _proposalId) external",
    "function getProposal(uint256 _proposalId) external view returns (address applicant, uint8 requestedRole, uint256 approveCount, uint256 rejectCount, uint256 deadline, uint8 status)",
    "function proposalCount() external view returns (uint256)",
    "function hasVoted(uint256, address) external view returns (bool)",

    // Events
    "event GenomicDataRegistered(uint256 indexed recordIndex, string pid, string fileHash, string fileId, address indexed registeredBy, uint256 timestamp)",
    "event ConsentGranted(uint256 indexed consentIndex, string pid, address indexed researcher, uint256 recordIndex, uint256 grantedAt, uint256 expiresAt)",
    "event ConsentRevoked(uint256 indexed consentIndex, string pid, address indexed researcher, uint256 timestamp)",
    "event DataAccessed(string pid, address indexed researcher, uint256 indexed recordIndex, uint256 indexed consentIndex, uint256 timestamp)",
    "event AccessDenied(string pid, address indexed researcher, uint256 indexed recordIndex, string reason, uint256 timestamp)",
    "event RegistrationProposed(uint256 indexed proposalId, address indexed applicant, uint8 requestedRole, uint256 deadline)",
    "event RegistrationVoted(uint256 indexed proposalId, address indexed voter, bool approve)",
    "event RegistrationApproved(uint256 indexed proposalId, address indexed applicant, uint8 role)",
    "event RegistrationRejected(uint256 indexed proposalId, address indexed applicant, uint8 role)",
] as const;

// Simplified ABI for specific operations
export const GENOMIC_ABI = [
    "function registerGenomicData(string calldata _pid, string calldata _fileHash, string calldata _fileId) external returns (uint256)",
    "function verifyIntegrity(uint256 _recordIndex, string calldata _fileHash) external view returns (bool matches)",
    "function getGenomicRecord(uint256 _index) external view returns (string pid, string fileHash, string fileId, address registeredBy, uint256 timestamp)",
    "function recordCount() external view returns (uint256)",
] as const;

export const VERIFICATION_ABI = [
    "function proposalCount() external view returns (uint256)",
    "function memberCount(uint8) external view returns (uint256)",
    "function roles(address) external view returns (uint8)",
    "function getProposal(uint256 _proposalId) external view returns (address, uint8, uint256, uint256, uint256, uint8)"
] as const;
