import { NextResponse } from 'next/server'
import { ethers } from 'ethers'
import connectDB from '@/lib/mongodb'
import { GenomicRecord } from '@/lib/models/GenomicRecord'

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
        await connectDB()
        const dbRecordCount = await GenomicRecord.countDocuments()
        const contract = getContract()
        const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545"
        const provider = new ethers.JsonRpcProvider(rpcUrl)

        // Get current block number and network stats
        const blockNumber = await provider.getBlockNumber()
        const feeData = await provider.getFeeData()

        // Fetch last 10 blocks
        const blocks = []
        const latestBlockNum = blockNumber
        const startBlock = Math.max(0, latestBlockNum - 9)

        for (let i = latestBlockNum; i >= startBlock; i--) {
            try {
                const block = await provider.getBlock(i)
                if (block) {
                    blocks.push({
                        number: block.number,
                        hash: block.hash,
                        timestamp: block.timestamp,
                        transactions: block.transactions.length,
                        gasUsed: block.gasUsed.toString(),
                        gasLimit: block.gasLimit.toString(),
                        miner: block.miner || '0x0000000000000000000000000000000000000000',
                    })
                }
            } catch (err) {
                console.error(`Error fetching block ${i}:`, err)
            }
        }

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

        // Fetch all records (limit to 50 for performance if many)
        const records = []
        const recordsToFetch = Math.min(recordCount, 50)
        for (let i = recordCount - 1; i >= recordCount - recordsToFetch; i--) {
            if (i < 0) break
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

        // Fetch all consents (limit to 50)
        const consents = []
        const consentsToFetch = Math.min(consentCount, 50)
        for (let i = consentCount - 1; i >= consentCount - consentsToFetch; i--) {
            if (i < 0) break
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

        // Query recent events (limit range for performance)
        let events: { name: string; blockNumber: number; txHash: string; args: Record<string, string | number | boolean> }[] = []
        try {
            const currentBlock = await provider.getBlockNumber()
            const fromBlock = Math.max(0, currentBlock - 5000) // last 5000 blocks
            const eventFilter = { address: await contract.getAddress(), fromBlock, toBlock: 'latest' }
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

        // Get network info
        const network = await provider.getNetwork()
        const chainId = network.chainId.toString()
        const networkName = network.name === 'unknown' ? 'Hardhat / Local' : network.name

        return NextResponse.json({
            success: true,
            blockNumber,
            gasPrice: feeData.gasPrice?.toString() || '0',
            chainId,
            networkName,
            blocks,
            stats: {
                totalRecords: dbRecordCount,
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
