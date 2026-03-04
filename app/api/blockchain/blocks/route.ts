import { NextRequest, NextResponse } from 'next/server'
import { getBlockDetails } from '@/lib/blockchain-storage'
import { getProvider } from '@/lib/blockchain'

// GET /api/blockchain/blocks - Get block information
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const blockNumber = searchParams.get('number')
        const blockHash = searchParams.get('hash')
        const latest = searchParams.get('latest') === 'true'

        if (latest) {
            // Get latest block
            const provider = getProvider()
            const latestBlock = await provider.getBlock('latest')
            
            if (!latestBlock) {
                return NextResponse.json({ 
                    error: 'Failed to fetch latest block' 
                }, { status: 500 })
            }

            // Try to get stored details, fallback to live data
            let storedBlock = await getBlockDetails(latestBlock.number)
            
            if (!storedBlock) {
                // Return live block data if not stored
                return NextResponse.json({
                    success: true,
                    data: {
                        blockNumber: latestBlock.number,
                        blockHash: latestBlock.hash,
                        timestamp: new Date(latestBlock.timestamp * 1000),
                        gasUsed: latestBlock.gasUsed.toString(),
                        gasLimit: latestBlock.gasLimit.toString(),
                        transactionCount: latestBlock.transactions.length,
                        miner: latestBlock.miner,
                        live: true
                    }
                })
            }

            return NextResponse.json({
                success: true,
                data: storedBlock
            })
        }

        if (blockNumber) {
            // Get specific block by number
            const blockNum = parseInt(blockNumber)
            const block = await getBlockDetails(blockNum)
            
            if (!block) {
                return NextResponse.json({ 
                    error: 'Block not found' 
                }, { status: 404 })
            }

            return NextResponse.json({
                success: true,
                data: block
            })
        }

        if (blockHash) {
            // Get block by hash (would need to implement this in storage service)
            return NextResponse.json({
                error: 'Search by hash not yet implemented'
            }, { status: 501 })
        }

        return NextResponse.json({
            error: 'Missing required parameter: number, hash, or latest=true'
        }, { status: 400 })

    } catch (error) {
        console.error('Blockchain blocks API error:', error)
        return NextResponse.json({ 
            error: 'Failed to fetch block',
            details: (error as Error).message 
        }, { status: 500 })
    }
}
