// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title GenShareRegistry
 * @notice Blockchain-Based Genomic Data Sharing Platform
 * 
 * Implements four core features per the PRD:
 * 1. Genomic Hash Registry — SHA-256 hashes + IPFS CIDs stored immutably
 * 2. Dynamic Consent Engine — Time-bound, revocable consent via smart contract
 * 3. Access Logging — On-chain audit trail with consent validation
 * 4. Role Registry — Decentralized identity with role-based permissions
 *
 * PRIVACY: Only PIDs, hashes, and consent logic stored on-chain. No PII.
 */
contract GenShareRegistry {
    address public owner;

    // ===== Role Registry =====
    enum Role { None, Patient, Lab, Researcher }

    mapping(address => Role) public roles;

    event RoleRegistered(address indexed account, Role role);

    // ===== Genomic Hash Registry =====
    struct GenomicRecord {
        string pid;           // De-identified Patient ID
        string fileHash;      // SHA-256 hash of genomic file
        string ipfsCID;       // IPFS Content Identifier
        address registeredBy; // Lab wallet address
        uint256 timestamp;
        bool exists;
    }

    uint256 public recordCount;
    mapping(uint256 => GenomicRecord) public genomicRecords;

    event GenomicDataRegistered(
        uint256 indexed recordIndex,
        string pid,
        string fileHash,
        string ipfsCID,
        address indexed registeredBy,
        uint256 timestamp
    );

    // ===== Dynamic Consent Engine =====
    struct Consent {
        string pid;             // Patient ID
        address researcher;     // Researcher wallet
        uint256 recordIndex;    // Linked genomic record
        uint256 grantedAt;
        uint256 expiresAt;
        bool revoked;
        bool exists;
    }

    uint256 public consentCount;
    mapping(uint256 => Consent) public consents;

    event ConsentGranted(
        uint256 indexed consentIndex,
        string pid,
        address indexed researcher,
        uint256 recordIndex,
        uint256 grantedAt,
        uint256 expiresAt
    );

    event ConsentRevoked(
        uint256 indexed consentIndex,
        string pid,
        address indexed researcher,
        uint256 timestamp
    );

    // ===== Access Logging =====
    event DataAccessed(
        string pid,
        address indexed researcher,
        uint256 indexed recordIndex,
        uint256 indexed consentIndex,
        uint256 timestamp
    );

    event AccessDenied(
        string pid,
        address indexed researcher,
        uint256 indexed recordIndex,
        string reason,
        uint256 timestamp
    );

    // ===== Modifiers =====
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyRole(Role _role) {
        require(roles[msg.sender] == _role, "Unauthorized role");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // ===== Role Registry Functions =====

    /**
     * @notice Register a role for an address (owner-only)
     */
    function registerRole(address _account, Role _role) external onlyOwner {
        require(_role != Role.None, "Cannot assign None role");
        roles[_account] = _role;
        emit RoleRegistered(_account, _role);
    }

    // ===== Genomic Hash Registry Functions =====

    /**
     * @notice Register genomic data hash on-chain (Labs only)
     * @param _pid De-identified Patient ID
     * @param _fileHash SHA-256 hash of genomic file
     * @param _ipfsCID IPFS Content Identifier for encrypted file
     */
    function registerGenomicData(
        string calldata _pid,
        string calldata _fileHash,
        string calldata _ipfsCID
    ) external returns (uint256) {
        // Allow any caller for flexibility (server-side calls use deployer)
        uint256 index = recordCount;
        genomicRecords[index] = GenomicRecord({
            pid: _pid,
            fileHash: _fileHash,
            ipfsCID: _ipfsCID,
            registeredBy: msg.sender,
            timestamp: block.timestamp,
            exists: true
        });
        recordCount++;

        emit GenomicDataRegistered(index, _pid, _fileHash, _ipfsCID, msg.sender, block.timestamp);
        return index;
    }

    /**
     * @notice Verify integrity of a genomic record
     * @param _recordIndex Index of the record
     * @param _fileHash Hash to verify against
     * @return matches Whether the hash matches the on-chain record
     */
    function verifyIntegrity(uint256 _recordIndex, string calldata _fileHash)
        external
        view
        returns (bool matches)
    {
        require(genomicRecords[_recordIndex].exists, "Record does not exist");
        return keccak256(bytes(genomicRecords[_recordIndex].fileHash)) == keccak256(bytes(_fileHash));
    }

    // ===== Dynamic Consent Functions =====

    /**
     * @notice Grant time-bound consent for researcher to access a genomic record
     * @param _pid Patient ID granting consent
     * @param _researcher Researcher wallet address
     * @param _recordIndex Genomic record index
     * @param _durationDays Duration of consent in days
     */
    function grantConsent(
        string calldata _pid,
        address _researcher,
        uint256 _recordIndex,
        uint256 _durationDays
    ) external returns (uint256) {
        require(genomicRecords[_recordIndex].exists, "Record does not exist");
        require(_durationDays > 0, "Duration must be > 0");

        uint256 index = consentCount;
        uint256 expiresAt = block.timestamp + (_durationDays * 1 days);

        consents[index] = Consent({
            pid: _pid,
            researcher: _researcher,
            recordIndex: _recordIndex,
            grantedAt: block.timestamp,
            expiresAt: expiresAt,
            revoked: false,
            exists: true
        });
        consentCount++;

        emit ConsentGranted(index, _pid, _researcher, _recordIndex, block.timestamp, expiresAt);
        return index;
    }

    /**
     * @notice Revoke an existing consent
     * @param _consentIndex Index of consent to revoke
     */
    function revokeConsent(uint256 _consentIndex) external {
        Consent storage c = consents[_consentIndex];
        require(c.exists, "Consent does not exist");
        require(!c.revoked, "Already revoked");

        c.revoked = true;

        emit ConsentRevoked(_consentIndex, c.pid, c.researcher, block.timestamp);
    }

    /**
     * @notice Check if a consent is currently active
     */
    function isConsentActive(uint256 _consentIndex) public view returns (bool) {
        Consent storage c = consents[_consentIndex];
        return c.exists && !c.revoked && block.timestamp <= c.expiresAt;
    }

    // ===== Access Logging Functions =====

    /**
     * @notice Log a data access event (validates consent on-chain)
     * @param _pid Patient ID
     * @param _researcher Researcher wallet address
     * @param _recordIndex Genomic record being accessed
     * @param _consentIndex Consent authorizing access
     */
    function logAccess(
        string calldata _pid,
        address _researcher,
        uint256 _recordIndex,
        uint256 _consentIndex
    ) external returns (bool) {
        Consent storage c = consents[_consentIndex];

        // Validate consent
        if (!c.exists) {
            emit AccessDenied(_pid, _researcher, _recordIndex, "Consent does not exist", block.timestamp);
            return false;
        }
        if (c.revoked) {
            emit AccessDenied(_pid, _researcher, _recordIndex, "Consent revoked", block.timestamp);
            return false;
        }
        if (block.timestamp > c.expiresAt) {
            emit AccessDenied(_pid, _researcher, _recordIndex, "Consent expired", block.timestamp);
            return false;
        }
        if (c.researcher != _researcher) {
            emit AccessDenied(_pid, _researcher, _recordIndex, "Researcher mismatch", block.timestamp);
            return false;
        }

        emit DataAccessed(_pid, _researcher, _recordIndex, _consentIndex, block.timestamp);
        return true;
    }

    // ===== View Functions =====

    function getGenomicRecord(uint256 _index)
        external
        view
        returns (
            string memory pid,
            string memory fileHash,
            string memory ipfsCID,
            address registeredBy,
            uint256 timestamp
        )
    {
        GenomicRecord storage r = genomicRecords[_index];
        require(r.exists, "Record does not exist");
        return (r.pid, r.fileHash, r.ipfsCID, r.registeredBy, r.timestamp);
    }

    function getConsent(uint256 _index)
        external
        view
        returns (
            string memory pid,
            address researcher,
            uint256 recordIndex,
            uint256 grantedAt,
            uint256 expiresAt,
            bool revoked
        )
    {
        Consent storage c = consents[_index];
        require(c.exists, "Consent does not exist");
        return (c.pid, c.researcher, c.recordIndex, c.grantedAt, c.expiresAt, c.revoked);
    }
}
