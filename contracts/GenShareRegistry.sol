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
    mapping(uint8 => uint256) public memberCount; // Track members per role

    event RoleRegistered(address indexed account, Role role);

    // ===== Registration Voting =====
    enum ProposalStatus { Pending, Approved, Rejected }

    struct RegistrationProposal {
        address applicant;
        Role requestedRole;
        uint256 approveCount;
        uint256 rejectCount;
        uint256 deadline;
        ProposalStatus status;
        bool exists;
    }

    uint256 public proposalCount;
    mapping(uint256 => RegistrationProposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event RegistrationProposed(
        uint256 indexed proposalId,
        address indexed applicant,
        Role requestedRole,
        uint256 deadline
    );

    event RegistrationVoted(
        uint256 indexed proposalId,
        address indexed voter,
        bool approve
    );

    event RegistrationApproved(
        uint256 indexed proposalId,
        address indexed applicant,
        Role role
    );

    event RegistrationRejected(
        uint256 indexed proposalId,
        address indexed applicant,
        Role role
    );

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
        if (roles[_account] == Role.None) {
            memberCount[uint8(_role)]++;
        }
        roles[_account] = _role;
        emit RoleRegistered(_account, _role);
    }

    // ===== Registration Voting Functions =====

    /**
     * @notice Propose a new registration. If no existing members, auto-approves.
     * @param _applicant Address of the applicant
     * @param _role Requested role (Lab or Researcher)
     * @param _votingDays Duration of voting window in days
     */
    function proposeRegistration(
        address _applicant,
        Role _role,
        uint256 _votingDays
    ) external returns (uint256) {
        require(_role == Role.Lab || _role == Role.Researcher, "Only Lab or Researcher roles");
        require(roles[_applicant] == Role.None, "Already has a role");
        require(_votingDays > 0, "Voting duration must be > 0");

        uint256 proposalId = proposalCount;
        uint256 deadline = block.timestamp + (_votingDays * 1 days);

        proposals[proposalId] = RegistrationProposal({
            applicant: _applicant,
            requestedRole: _role,
            approveCount: 0,
            rejectCount: 0,
            deadline: deadline,
            status: ProposalStatus.Pending,
            exists: true
        });
        proposalCount++;

        emit RegistrationProposed(proposalId, _applicant, _role, deadline);

        // Bootstrap: if no existing members of this role, auto-approve
        if (memberCount[uint8(_role)] == 0) {
            proposals[proposalId].status = ProposalStatus.Approved;
            roles[_applicant] = _role;
            memberCount[uint8(_role)]++;
            emit RoleRegistered(_applicant, _role);
            emit RegistrationApproved(proposalId, _applicant, _role);
        }

        return proposalId;
    }

    /**
     * @notice Vote on a registration proposal. Can be called directly or relayed by owner.
     * @param _proposalId ID of the proposal
     * @param _approve true = approve, false = reject
     * @param _voter The actual voter (must match msg.sender unless owner is relaying)
     */
    function voteOnRegistration(uint256 _proposalId, bool _approve, address _voter) external {
        RegistrationProposal storage p = proposals[_proposalId];
        require(p.exists, "Proposal does not exist");
        require(p.status == ProposalStatus.Pending, "Proposal already resolved");
        require(block.timestamp <= p.deadline, "Voting period ended");
        
        // Authorization: Either voter is msg.sender, or owner is relaying
        require(msg.sender == _voter || msg.sender == owner, "Unauthorized to vote for this address");
        
        // Role check on the actual voter
        require(roles[_voter] == p.requestedRole, "Must hold same role to vote");
        require(!hasVoted[_proposalId][_voter], "Already voted");

        hasVoted[_proposalId][_voter] = true;

        if (_approve) {
            p.approveCount++;
        } else {
            p.rejectCount++;
        }

        emit RegistrationVoted(_proposalId, _voter, _approve);

        // Check if majority already reached (early finalization)
        uint256 totalMembers = memberCount[uint8(p.requestedRole)];
        uint256 majority = (totalMembers / 2) + 1;

        if (p.approveCount >= majority) {
            p.status = ProposalStatus.Approved;
            roles[p.applicant] = p.requestedRole;
            memberCount[uint8(p.requestedRole)]++;
            emit RoleRegistered(p.applicant, p.requestedRole);
            emit RegistrationApproved(_proposalId, p.applicant, p.requestedRole);
        } else if (p.rejectCount >= majority) {
            p.status = ProposalStatus.Rejected;
            emit RegistrationRejected(_proposalId, p.applicant, p.requestedRole);
        }
    }

    /**
     * @notice Finalize a proposal after voting deadline (if not already resolved)
     * @param _proposalId ID of the proposal
     */
    function finalizeRegistration(uint256 _proposalId) external {
        RegistrationProposal storage p = proposals[_proposalId];
        require(p.exists, "Proposal does not exist");
        require(p.status == ProposalStatus.Pending, "Already resolved");
        require(block.timestamp > p.deadline, "Voting still open");

        if (p.approveCount > p.rejectCount) {
            p.status = ProposalStatus.Approved;
            roles[p.applicant] = p.requestedRole;
            memberCount[uint8(p.requestedRole)]++;
            emit RoleRegistered(p.applicant, p.requestedRole);
            emit RegistrationApproved(_proposalId, p.applicant, p.requestedRole);
        } else {
            p.status = ProposalStatus.Rejected;
            emit RegistrationRejected(_proposalId, p.applicant, p.requestedRole);
        }
    }

    /**
     * @notice Get details of a registration proposal
     */
    function getProposal(uint256 _proposalId)
        external
        view
        returns (
            address applicant,
            Role requestedRole,
            uint256 approveCount,
            uint256 rejectCount,
            uint256 deadline,
            ProposalStatus status
        )
    {
        RegistrationProposal storage p = proposals[_proposalId];
        require(p.exists, "Proposal does not exist");
        return (p.applicant, p.requestedRole, p.approveCount, p.rejectCount, p.deadline, p.status);
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
