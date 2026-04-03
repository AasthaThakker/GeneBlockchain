import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { BlockchainTransactionModel } from '@/lib/models/BlockchainTransaction'

export async function GET() {
    try {
        await connectDB()
        
        // Get latest blockchain transactions from MongoDB
        const transactions = await BlockchainTransactionModel.find({})
            .sort({ timestamp: -1 })
            .limit(50)
            .select('txHash blockNumber timestamp functionName operationType gasUsed gasPrice status latency executionTime')
            .lean()
        
        // Get blockchain blocks for block chain visualization
        const blocks = await BlockchainTransactionModel.find({ blockNumber: { $exists: true } })
            .sort({ blockNumber: -1 })
            .limit(10)
            .select('blockNumber timestamp')
            .lean()
        
        // Get unique blocks with transaction counts
        const blockStats = await BlockchainTransactionModel.aggregate([
            { $match: { blockNumber: { $exists: true } } },
            { $group: { _id: '$blockNumber', count: { $sum: 1 }, gasUsed: { $avg: '$gasUsed' }, timestamp: { $first: '$timestamp' } } },
            { $sort: { _id: -1 } },
            { $limit: 10 }
        ])
        
        // Calculate stats
        const totalRecords = await BlockchainTransactionModel.countDocuments()
        const totalEvents = await BlockchainTransactionModel.countDocuments({ 
            $or: [
                { functionName: { $regex: 'grantConsent|logAccess' } },
                { operationType: { $in: ['CONSENT', 'ACCESS_REQUEST'] } }
            ]
        })
        
        const operationStats = await BlockchainTransactionModel.aggregate([
            { $match: { operationType: { $exists: true } } },
            { $group: { _id: '$operationType', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ])
        
        // Get recent events for event log
        const recentEvents = await BlockchainTransactionModel.find({
            $or: [
                { functionName: { $regex: 'grantConsent|logAccess' } },
                { operationType: { $in: ['CONSENT', 'ACCESS_REQUEST'] } }
            ]
        })
        .sort({ timestamp: -1 })
        .limit(20)
        .select('txHash timestamp functionName operationType functionParameters blockNumber')
        .lean()
        
        // Format events for display
        const formattedEvents = recentEvents.map((tx: any) => {
            let eventName = 'Unknown'
            let eventArgs: any = {}
            
            if (tx.functionName === 'registerGenomicData') {
                eventName = 'GenomicDataRegistered'
                eventArgs = {
                    recordIndex: tx.functionParameters?.recordIndex || 0,
                    pid: tx.functionParameters?.pid || '',
                    fileHash: tx.functionParameters?.fileHash || '',
                    ipfsCID: tx.functionParameters?.ipfsCID || '',
                    registeredBy: tx.from || ''
                }
            } else if (tx.functionName === 'grantConsent') {
                eventName = 'ConsentGranted'
                eventArgs = {
                    consentIndex: tx.functionParameters?.recordIndex || 0,
                    pid: tx.functionParameters?.pid || '',
                    researcher: tx.functionParameters?.researcher || '',
                    recordIndex: tx.functionParameters?.recordIndex || 0,
                    grantedAt: Math.floor((tx.timestamp?.getTime() || Date.now()) / 1000),
                    expiresAt: Math.floor((tx.timestamp?.getTime() || Date.now()) / 1000) + (30 * 24 * 60 * 60), // 30 days
                    revoked: false
                }
            } else if (tx.functionName === 'logAccess') {
                eventName = 'DataAccessed'
                eventArgs = {
                    pid: tx.functionParameters?.pid || '',
                    researcher: tx.functionParameters?.researcher || '',
                    recordIndex: tx.functionParameters?.recordIndex || 0,
                    consentIndex: tx.functionParameters?.consentIndex || 0,
                    timestamp: Math.floor((tx.timestamp?.getTime() || Date.now()) / 1000)
                }
            }
            
            return {
                name: eventName,
                blockNumber: tx.blockNumber,
                txHash: tx.txHash,
                args: eventArgs
            }
        }).filter((event: any) => event.name !== 'Unknown')
        
        // Get network info
        const latestBlock = blocks.length > 0 ? Math.max(...blocks.map((b: any) => b.blockNumber)) : 0
        
        return NextResponse.json({
            success: true,
            blockNumber: latestBlock,
            gasPrice: '20', // Hardhat default
            chainId: '31337', // Hardhat chain ID
            networkName: 'Hardhat Network',
            blocks: blockStats.map((block: any) => ({
                number: block._id,
                hash: `0x${Math.random().toString(16).substring(2, 14)}padded`, // Generate mock hash
                timestamp: block.timestamp.getTime() / 1000,
                transactions: block.count,
                gasUsed: Math.round(block.gasUsed || 0).toString(),
                gasLimit: '30000000', // Hardhat default
                miner: '0x5FbDB2315678afecb367f032d93F642f64180aa3' // Deployer address
            })),
            stats: {
                totalRecords,
                totalConsents: operationStats.find((s: any) => s._id === 'CONSENT')?.count || 0,
                totalProposals: 0, // Not implemented in current transactions
                members: { patients: 0, labs: 0, researchers: 0 }, // Not tracked in current schema
                totalEvents: totalEvents
            },
            records: transactions.map((tx: any) => ({
                index: tx.blockNumber || 0,
                pid: tx.functionParameters?.pid || `TX-${tx.txHash?.substring(0, 8)}`,
                fileHash: tx.functionParameters?.fileHash || tx.txHash?.substring(0, 20) + '...',
                ipfsCID: tx.functionParameters?.ipfsCID || `Qm${tx.txHash?.substring(0, 44)}`,
                registeredBy: tx.from || '0xUnknown',
                timestamp: tx.timestamp?.getTime() / 1000 || Date.now()
            })),
            consents: transactions
                .filter((tx: any) => tx.operationType === 'CONSENT')
                .map((tx: any, index: number) => ({
                    index: index + 1,
                    pid: tx.functionParameters?.pid || `CONSENT-${index}`,
                    researcher: tx.functionParameters?.researcher || '0xResearcher',
                    recordIndex: tx.functionParameters?.recordIndex || index,
                    grantedAt: tx.timestamp?.getTime() / 1000 || Date.now(),
                    expiresAt: (tx.timestamp?.getTime() || Date.now()) + (30 * 24 * 60 * 60 * 1000),
                    revoked: false
                })),
            proposals: [], // Not implemented
            events: formattedEvents
        })
        
    } catch (error: unknown) {
        console.error('[MongoDB Explorer] Error:', error)
        const err = error as { message?: string }
        return NextResponse.json(
            { error: `Failed to fetch MongoDB data: ${err.message || 'Unknown error'}` },
            { status: 500 }
        )
    }
}
