import { NextResponse } from 'next/server'
import { ethers } from 'ethers'

const CONTRACT_ABI = [
    "function recordCount() external view returns (uint256)",
    "function consentCount() external view returns (uint256)",
    "function proposalCount() external view returns (uint256)",
    "function getGenomicRecord(uint256 _index) external view returns (string pid, string fileHash, string ipfsCID, address registeredBy, uint256 timestamp)",
    "function getConsent(uint256 _index) external view returns (string pid, address researcher, uint256 recordIndex, uint256 grantedAt, uint256 expiresAt, bool revoked)",
    "function getProposal(uint256 _proposalId) external view returns (address applicant, uint8 requestedRole, uint256 approveCount, uint256 rejectCount, uint256 deadline, uint8 status)",
    "function memberCount(uint8) external view returns (uint256)",

    // Events
    "event GenomicDataRegistered(uint256 indexed recordIndex, string pid, string fileHash, string ipfsCID, address indexed registeredBy, uint256 timestamp)",
    "event ConsentGranted(uint256 indexed consentIndex, string pid, address indexed researcher, uint256 recordIndex, uint256 grantedAt, uint256 expiresAt)",
    "event ConsentRevoked(uint256 indexed consentIndex, string pid, address indexed researcher, uint256 timestamp)",
    "event DataAccessed(string pid, address indexed researcher, uint256 indexed recordIndex, uint256 indexed consentIndex, uint256 timestamp)",
    "event AccessDenied(string pid, address indexed researcher, uint256 indexed recordIndex, string reason, uint256 timestamp)",
    "event RegistrationProposed(uint256 indexed proposalId, address indexed applicant, uint8 requestedRole, uint256 deadline)",
    "event RegistrationVoted(uint256 indexed proposalId, address indexed voter, bool approve)",
    "event RegistrationApproved(uint256 indexed proposalId, address indexed applicant, uint8 role)",
    "event RegistrationRejected(uint256 indexed proposalId, address indexed applicant, uint8 role)",
]

const ROLE_NAMES: Record<number, string> = { 0: 'None', 1: 'Patient', 2: 'Lab', 3: 'Researcher' }
const PROPOSAL_STATUS: Record<number, string> = { 0: 'Pending', 1: 'Approved', 2: 'Rejected' }

function getContract() {
    const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545"
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS
    if (!contractAddress) throw new Error("NEXT_PUBLIC_CONTRACT_ADDRESS not set")
    const provider = new ethers.JsonRpcProvider(rpcUrl)
    return new ethers.Contract(contractAddress, CONTRACT_ABI, provider)
}

// Safe wrapper: calls a contract function and returns fallback on failure
async function safeCall<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
    try { return await fn() } catch { return fallback }
}

export async function GET() {
    try {
        const contract = getContract()
        const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545"
        const provider = new ethers.JsonRpcProvider(rpcUrl)

        // Get current block number
        const blockNumber = await provider.getBlockNumber()

        // Get counts — each is individually safe so older contracts don't crash
        const [recordCount, consentCount, proposalCount] = await Promise.all([
            safeCall(() => contract.recordCount().then(Number), 0),
            safeCall(() => contract.consentCount().then(Number), 0),
            safeCall(() => contract.proposalCount().then(Number), 0),
        ])

        // Get member counts
        const [patientCount, labCount, researcherCount] = await Promise.all([
            safeCall(() => contract.memberCount(1).then(Number), 0),
            safeCall(() => contract.memberCount(2).then(Number), 0),
            safeCall(() => contract.memberCount(3).then(Number), 0),
        ])

        // Fetch all records
        const records = []
        for (let i = 0; i < recordCount; i++) {
            try {
                const r = await contract.getGenomicRecord(i)
                records.push({
                    index: i,
                    pid: r[0],
                    fileHash: r[1],
                    ipfsCID: r[2],
                    registeredBy: r[3],
                    timestamp: Number(r[4]),
                })
            } catch { /* skip */ }
        }

        // Fetch all consents
        const consents = []
        for (let i = 0; i < consentCount; i++) {
            try {
                const c = await contract.getConsent(i)
                consents.push({
                    index: i,
                    pid: c[0],
                    researcher: c[1],
                    recordIndex: Number(c[2]),
                    grantedAt: Number(c[3]),
                    expiresAt: Number(c[4]),
                    revoked: c[5],
                })
            } catch { /* skip */ }
        }

        // Fetch all proposals
        const proposals = []
        for (let i = 0; i < proposalCount; i++) {
            try {
                const p = await contract.getProposal(i)
                proposals.push({
                    id: i,
                    applicant: p[0],
                    requestedRole: ROLE_NAMES[Number(p[1])] || `Role ${p[1]}`,
                    approveCount: Number(p[2]),
                    rejectCount: Number(p[3]),
                    deadline: Number(p[4]),
                    status: PROPOSAL_STATUS[Number(p[5])] || 'Unknown',
                })
            } catch { /* skip */ }
        }

        // Query all events from block 0 to latest
        let events: { name: string; blockNumber: number; txHash: string; args: Record<string, string | number | boolean> }[] = []
        try {
            const eventFilter = { address: await contract.getAddress(), fromBlock: 0, toBlock: 'latest' }
            const logs = await provider.getLogs(eventFilter)

            events = logs.map((log) => {
                try {
                    const parsed = contract.interface.parseLog({ topics: [...log.topics], data: log.data })
                    if (!parsed) return null
                    return {
                        name: parsed.name,
                        blockNumber: log.blockNumber,
                        txHash: log.transactionHash,
                        args: formatArgs(parsed),
                    }
                } catch {
                    return null
                }
            }).filter((e): e is NonNullable<typeof e> => e !== null)
        } catch {
            // Event querying failed — continue with empty events
        }

        return NextResponse.json({
            success: true,
            blockNumber,
            stats: {
                totalRecords: recordCount,
                totalConsents: consentCount,
                totalProposals: proposalCount,
                members: { patients: patientCount, labs: labCount, researchers: researcherCount },
                totalEvents: events.length,
            },
            records,
            consents,
            proposals,
            events,
        })
    } catch (error: unknown) {
        const err = error as { message?: string }
        console.error('[BlockchainExplorer] Error:', err.message)
        return NextResponse.json(
            { error: `Failed to fetch blockchain data: ${err.message || 'Unknown'}` },
            { status: 500 }
        )
    }
}

function formatArgs(parsed: ethers.LogDescription): Record<string, string | number | boolean> {
    const result: Record<string, string | number | boolean> = {}
    const fragment = parsed.fragment
    if (fragment.inputs) {
        fragment.inputs.forEach((input, i) => {
            const val = parsed.args[i]
            if (typeof val === 'bigint') {
                result[input.name] = Number(val)
            } else if (typeof val === 'boolean') {
                result[input.name] = val
            } else {
                result[input.name] = String(val)
            }
        })
    }
    return result
}
