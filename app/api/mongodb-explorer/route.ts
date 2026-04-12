import { NextResponse } from 'next/server'
import { ethers } from 'ethers'
import connectDB from '@/lib/mongodb'
import { EncryptedFile } from '@/lib/models/EncryptedFile'
import { User } from '@/lib/models/User'

export async function GET() {
    try {
        // Connect to Ganache blockchain
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'http://127.0.0.1:8545')
        
        // Get real blockchain data
        const latestBlockNumber = await provider.getBlockNumber()
        const latestBlock = await provider.getBlock('latest')
        const network = await provider.getNetwork()
        const gasPrice = await provider.getFeeData()
        
        // Get recent blocks with transaction details
        const blocks = []
        for (let i = 0; i < Math.min(10, latestBlockNumber + 1); i++) {
            const blockNumber = latestBlockNumber - i
            const block = await provider.getBlock(blockNumber, true)
            if (block) {
                blocks.push({
                    number: block.number,
                    hash: block.hash,
                    timestamp: block.timestamp,
                    transactions: block.transactions.length,
                    gasUsed: block.gasUsed.toString(),
                    gasLimit: block.gasLimit.toString(),
                    miner: block.miner
                })
            }
        }
        
        // Get database stats
        await connectDB()
        const totalRecords = await EncryptedFile.countDocuments()
        
        // Get member counts from database
        const [patients, labs, researchers] = await Promise.all([
            User.countDocuments({ role: 'PATIENT' }),
            User.countDocuments({ role: 'LAB' }),
            User.countDocuments({ role: 'RESEARCHER' })
        ])
        
        // Get recent files from database for records
        const recentFiles = await EncryptedFile.find({})
            .sort({ uploadDate: -1 })
            .limit(10)
            .select('fileId fileName pid labId uploadDate blockchainTxHash')
            .lean()
        
        // Format records from database
        const records = recentFiles.map((file: any, index: number) => ({
            index: index + 1,
            pid: file.pid,
            fileHash: file.fileId, // Using fileId as hash reference
            ipfsCID: `Qm${file.fileId.slice(-44)}`, // Mock IPFS CID
            registeredBy: file.labId,
            timestamp: new Date(file.uploadDate).getTime() / 1000
        }))
        
        // Mock events based on database activity
        const events = recentFiles.map((file: any) => ({
            name: 'GenomicDataRegistered',
            blockNumber: latestBlockNumber,
            txHash: file.blockchainTxHash || `0x${Math.random().toString(16).substring(2, 66)}`,
            args: {
                recordIndex: 1,
                pid: file.pid,
                fileHash: file.fileId,
                ipfsCID: `Qm${file.fileId.slice(-44)}`,
                registeredBy: file.labId
            }
        }))
        
        return NextResponse.json({
            success: true,
            blockNumber: latestBlockNumber,
            gasPrice: ethers.formatUnits(gasPrice.gasPrice || 0, 'gwei'),
            chainId: network.chainId.toString(),
            networkName: network.name === 'hardhat' ? 'Hardhat Network' : network.name,
            blocks,
            stats: {
                totalRecords,
                totalConsents: 0, // Will be implemented with proper contract events
                totalProposals: 0, // Will be implemented with proper contract events
                members: { patients, labs, researchers },
                totalEvents: events.length
            },
            records,
            consents: [], // Will be implemented with proper contract events
            proposals: [], // Will be implemented with proper contract events
            events
        })
        
    } catch (error: unknown) {
        console.error('[Blockchain Explorer] Error:', error)
        const err = error as { message?: string }
        return NextResponse.json(
            { error: `Failed to fetch blockchain data: ${err.message || 'Unknown error'}` },
            { status: 500 }
        )
    }
}
