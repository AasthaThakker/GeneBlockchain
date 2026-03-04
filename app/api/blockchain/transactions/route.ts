import { NextRequest, NextResponse } from 'next/server'
import { getTransactionDetails, getTransactionsByAddress, getTransactionsByFunction, getBlockchainStats } from '@/lib/blockchain-storage'

// GET /api/blockchain/transactions - Get transactions with filters
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const txHash = searchParams.get('hash')
        const address = searchParams.get('address')
        const function_name = searchParams.get('function')
        const limit = parseInt(searchParams.get('limit') || '50')
        const offset = parseInt(searchParams.get('offset') || '0')
        const stats = searchParams.get('stats') === 'true'

        if (stats) {
            // Return blockchain statistics
            const blockchainStats = await getBlockchainStats()
            return NextResponse.json({
                success: true,
                data: blockchainStats
            })
        }

        if (txHash) {
            // Get specific transaction
            const transaction = await getTransactionDetails(txHash)
            if (!transaction) {
                return NextResponse.json({ 
                    error: 'Transaction not found' 
                }, { status: 404 })
            }

            return NextResponse.json({
                success: true,
                data: transaction
            })
        }

        if (address) {
            // Get transactions by address
            const transactions = await getTransactionsByAddress(address, limit, offset)
            return NextResponse.json({
                success: true,
                data: transactions,
                pagination: { limit, offset }
            })
        }

        if (function_name) {
            // Get transactions by function name
            const transactions = await getTransactionsByFunction(function_name, limit, offset)
            return NextResponse.json({
                success: true,
                data: transactions,
                pagination: { limit, offset }
            })
        }

        return NextResponse.json({
            error: 'Missing required parameter: hash, address, function, or stats=true'
        }, { status: 400 })

    } catch (error) {
        console.error('Blockchain transactions API error:', error)
        return NextResponse.json({ 
            error: 'Failed to fetch transactions',
            details: (error as Error).message 
        }, { status: 500 })
    }
}
