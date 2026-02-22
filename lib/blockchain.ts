import { ethers } from 'ethers';

// ABI for GenShareRegistry — only the functions we use from the API routes
const CONTRACT_ABI = [
    // Genomic Hash Registry
    "function registerGenomicData(string calldata _pid, string calldata _fileHash, string calldata _ipfsCID) external returns (uint256)",
    "function verifyIntegrity(uint256 _recordIndex, string calldata _fileHash) external view returns (bool matches)",
    "function getGenomicRecord(uint256 _index) external view returns (string pid, string fileHash, string ipfsCID, address registeredBy, uint256 timestamp)",
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

    // Events
    "event GenomicDataRegistered(uint256 indexed recordIndex, string pid, string fileHash, string ipfsCID, address indexed registeredBy, uint256 timestamp)",
    "event ConsentGranted(uint256 indexed consentIndex, string pid, address indexed researcher, uint256 recordIndex, uint256 grantedAt, uint256 expiresAt)",
    "event ConsentRevoked(uint256 indexed consentIndex, string pid, address indexed researcher, uint256 timestamp)",
    "event DataAccessed(string pid, address indexed researcher, uint256 indexed recordIndex, uint256 indexed consentIndex, uint256 timestamp)",
    "event AccessDenied(string pid, address indexed researcher, uint256 indexed recordIndex, string reason, uint256 timestamp)",
];

// Default Hardhat account #0 private key (well-known, only for local dev)
const DEFAULT_HARDHAT_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

function getProvider() {
    const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545";
    return new ethers.JsonRpcProvider(rpcUrl);
}

function getSigner() {
    const provider = getProvider();
    const privateKey = process.env.HARDHAT_PRIVATE_KEY || DEFAULT_HARDHAT_KEY;
    return new ethers.Wallet(privateKey, provider);
}

function getContract() {
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    if (!contractAddress) {
        throw new Error("NEXT_PUBLIC_CONTRACT_ADDRESS not set in .env");
    }
    const signer = getSigner();
    return new ethers.Contract(contractAddress, CONTRACT_ABI, signer);
}

// ===== Genomic Hash Registry =====

/**
 * Register genomic data hash on-chain
 * @returns Transaction hash
 */
export async function registerGenomicData(
    pid: string,
    fileHash: string,
    ipfsCID: string
): Promise<{ txHash: string; recordIndex: number }> {
    const contract = getContract();
    const tx = await contract.registerGenomicData(pid, fileHash, ipfsCID);
    const receipt = await tx.wait();

    // Parse the event to get the record index
    const event = receipt.logs
        .map((log: ethers.Log) => {
            try {
                return contract.interface.parseLog({ topics: [...log.topics], data: log.data });
            } catch {
                return null;
            }
        })
        .find((e: ethers.LogDescription | null) => e?.name === "GenomicDataRegistered");

    const recordIndex = event ? Number(event.args.recordIndex) : -1;

    return { txHash: receipt.hash, recordIndex };
}

/**
 * Verify integrity of a genomic record against on-chain hash
 */
export async function verifyIntegrity(
    recordIndex: number,
    fileHash: string
): Promise<boolean> {
    const contract = getContract();
    return await contract.verifyIntegrity(recordIndex, fileHash);
}

// ===== Dynamic Consent =====

/**
 * Grant time-bound consent on-chain
 * @returns Transaction hash and consent index
 */
export async function grantConsent(
    pid: string,
    researcherAddress: string,
    recordIndex: number,
    durationDays: number
): Promise<{ txHash: string; consentIndex: number }> {
    const contract = getContract();
    const tx = await contract.grantConsent(pid, researcherAddress, recordIndex, durationDays);
    const receipt = await tx.wait();

    const event = receipt.logs
        .map((log: ethers.Log) => {
            try {
                return contract.interface.parseLog({ topics: [...log.topics], data: log.data });
            } catch {
                return null;
            }
        })
        .find((e: ethers.LogDescription | null) => e?.name === "ConsentGranted");

    const consentIndex = event ? Number(event.args.consentIndex) : -1;

    return { txHash: receipt.hash, consentIndex };
}

/**
 * Revoke consent on-chain
 * @returns Transaction hash
 */
export async function revokeConsentOnChain(
    consentIndex: number
): Promise<{ txHash: string }> {
    const contract = getContract();
    const tx = await contract.revokeConsent(consentIndex);
    const receipt = await tx.wait();
    return { txHash: receipt.hash };
}

/**
 * Check if consent is active on-chain
 */
export async function checkConsentActive(consentIndex: number): Promise<boolean> {
    const contract = getContract();
    return await contract.isConsentActive(consentIndex);
}

// ===== Access Logging =====

/**
 * Log data access event on-chain (validates consent)
 * @returns Transaction hash and whether access was granted
 */
export async function logAccessOnChain(
    pid: string,
    researcherAddress: string,
    recordIndex: number,
    consentIndex: number
): Promise<{ txHash: string; accessGranted: boolean }> {
    const contract = getContract();
    const tx = await contract.logAccess(pid, researcherAddress, recordIndex, consentIndex);
    const receipt = await tx.wait();

    // Check if DataAccessed or AccessDenied was emitted
    const accessEvent = receipt.logs
        .map((log: ethers.Log) => {
            try {
                return contract.interface.parseLog({ topics: [...log.topics], data: log.data });
            } catch {
                return null;
            }
        })
        .find((e: ethers.LogDescription | null) => e?.name === "DataAccessed" || e?.name === "AccessDenied");

    const accessGranted = accessEvent?.name === "DataAccessed";

    return { txHash: receipt.hash, accessGranted };
}

// ===== Utility =====

/**
 * Check if blockchain is reachable
 */
export async function isBlockchainAvailable(): Promise<boolean> {
    try {
        const provider = getProvider();
        await provider.getBlockNumber();
        return true;
    } catch {
        return false;
    }
}

/**
 * Get on-chain record count
 */
export async function getOnChainRecordCount(): Promise<number> {
    const contract = getContract();
    return Number(await contract.recordCount());
}

/**
 * Get on-chain consent count
 */
export async function getOnChainConsentCount(): Promise<number> {
    const contract = getContract();
    return Number(await contract.consentCount());
}
