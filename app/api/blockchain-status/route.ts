import { NextResponse } from 'next/server'
import { isBlockchainAvailable, getOnChainRecordCount, getOnChainConsentCount } from '@/lib/blockchain'

export async function GET() {
    try {
        const available = await isBlockchainAvailable()

        if (!available) {
            return NextResponse.json({
                success: true,
                data: {
                    status: 'offline',
                    message: 'Hardhat node is not running. Start with: npm run hardhat:node',
                    contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || 'Not set',
                }
            })
        }

        const recordCount = await getOnChainRecordCount()
        const consentCount = await getOnChainConsentCount()

        return NextResponse.json({
            success: true,
            data: {
                status: 'online',
                contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
                rpcUrl: process.env.RPC_URL || 'http://127.0.0.1:8545',
                onChainRecords: recordCount,
                onChainConsents: consentCount,
            }
        })
    } catch (error) {
        console.error('Blockchain status error:', error)
        return NextResponse.json({ error: 'Failed to check blockchain status' }, { status: 500 })
    }
}
