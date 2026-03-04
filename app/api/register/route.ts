import { NextRequest, NextResponse } from 'next/server'
import { registerGenomicData } from '@/lib/blockchain'
import { storeTransaction } from '@/lib/blockchain-storage'

// Types for transaction storage
interface ITransactionData {
    txHash: string;
    blockNumber?: number;
    blockHash?: string;
    transactionIndex?: number;
    gasUsed: string;
    gasPrice: string;
    gasLimit: string;
    from: string;
    to: string;
    value: string;
    data: string;
    nonce: number;
    status: boolean;
    timestamp: Date;
    confirmations?: number;
    contractAddress?: string;
    functionName?: string;
    functionParameters?: any;
    events: any[];
    relatedEntity?: any;
    networkId: string;
}

// POST /api/register - Register genomic data on blockchain
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const pid = formData.get('pid') as string
        const fileHash = formData.get('fileHash') as string
        const ipfsCID = formData.get('ipfsCID') as string
        const labId = formData.get('labId') as string
        const labName = formData.get('labName') as string

        if (!pid || !fileHash || !ipfsCID || !labId || !labName) {
            return NextResponse.json({ error: 'Missing required data' }, { status: 400 })
        }

        console.log(`[Blockchain] Registering genomic data on-chain: PID=${pid}, Hash=${fileHash}, CID=${ipfsCID}`)

        // Register on blockchain
        const result = await registerGenomicData(pid, fileHash, ipfsCID)
        
        // Store comprehensive transaction details
        try {
            // Get transaction receipt for detailed storage
            const { ethers } = require('ethers')
            const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545')
            
            // Get transaction details
            const tx = await provider.getTransaction(result.txHash)
            const receipt = await provider.getTransactionReceipt(result.txHash)
            
            if (tx && receipt) {
                const transactionData: ITransactionData = {
                    // Transaction Details
                    txHash: result.txHash,
                    blockNumber: receipt.blockNumber,
                    blockHash: receipt.blockHash,
                    transactionIndex: receipt.index,
                    
                    // Gas Information
                    gasUsed: receipt.gasUsed.toString(),
                    gasPrice: tx.gasPrice?.toString() || '0',
                    gasLimit: tx.gasLimit.toString(),
                    effectiveGasPrice: tx.gasPrice?.toString() || '0',
                    
                    // Transaction Details
                    from: tx.from,
                    to: tx.to || '',
                    value: tx.value.toString(),
                    data: tx.data,
                    nonce: tx.nonce,
                    
                    // Status & Timing
                    status: receipt.status === 1,
                    timestamp: new Date(),
                    confirmations: receipt.confirmations,
                    
                    // Contract Interaction Details
                    contractAddress: tx.to,
                    functionName: 'registerGenomicData',
                    functionParameters: { pid, fileHash, ipfsCID, labId, labName },
                    
                    // Event Information
                    events: receipt.logs.map((log: any, index: number) => ({
                        name: `Event${index}`,
                        signature: log.topics[0] || '',
                        args: {
                            topics: log.topics,
                            data: log.data
                        },
                        address: log.address,
                        logIndex: log.index
                    })),
                    
                    // Related Entity
                    relatedEntity: {
                        type: 'GenomicData',
                        id: result.recordIndex.toString()
                    },
                    
                    // Metadata
                    networkId: 'localhost'
                }
                
                await storeTransaction(transactionData)
                
                console.log(`[Blockchain] Transaction stored: ${result.txHash}`)
            }
        } catch (storageError) {
            console.error('[Blockchain] Failed to store transaction details:', storageError)
        }

        return NextResponse.json({
            success: true,
            data: {
                txHash: result.txHash,
                recordIndex: result.recordIndex,
                pid,
                fileHash,
                ipfsCID,
                labId,
                labName,
                registeredAt: new Date().toISOString()
            }
        })

    } catch (error) {
        console.error('Blockchain registration error:', error)
        return NextResponse.json({ 
            error: 'Registration failed', 
            details: (error as Error).message 
        }, { status: 500 })
    }
}
