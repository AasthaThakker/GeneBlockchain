import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { EncryptedFile } from '@/lib/models/EncryptedFile'
import { registerGenomicData, isBlockchainAvailable } from '@/lib/blockchain'

export async function POST(request: NextRequest) {
    try {
        await connectDB()

        const body = await request.json()
        const { fileIds } = body

        if (!fileIds || !Array.isArray(fileIds)) {
            return NextResponse.json({ 
                error: 'fileIds array is required' 
            }, { status: 400 })
        }

        const results = []

        // Check blockchain availability
        const chainAvailable = await isBlockchainAvailable()
        if (!chainAvailable) {
            return NextResponse.json({ 
                error: 'Blockchain node is not available. Please ensure the node is running.' 
            }, { status: 503 })
        }

        for (const fileId of fileIds) {
            try {
                // Find the file in database
                const file = await EncryptedFile.findOne({ fileId })
                if (!file) {
                    results.push({
                        fileId,
                        success: false,
                        error: 'File not found in database'
                    })
                    continue
                }

                // Check if blockchain is empty - if so, force re-registration of all files
                let forceReregistration = false
                try {
                    const { getOnChainRecordCount } = await import('@/lib/blockchain')
                    const recordCount = await getOnChainRecordCount()
                    forceReregistration = recordCount === 0
                    console.log(`[Registration] File ${fileId}: Blockchain record count=${recordCount}, forceReregistration=${forceReregistration}`)
                } catch (error) {
                    console.error('Error checking record count:', error)
                }

                // If blockchain is empty, clear old references and force re-registration
                if (forceReregistration) {
                    console.log(`[Registration] Clearing old blockchain references for file ${fileId}`)
                    await EncryptedFile.updateOne(
                        { fileId },
                        { 
                            $unset: {
                                onChainRecordIndex: 1,
                                blockchainTxHash: 1
                            }
                        }
                    )
                } else if (file.onChainRecordIndex !== undefined && file.onChainRecordIndex >= 0) {
                    // Only skip if blockchain has data AND file is already registered
                    results.push({
                        fileId,
                        success: false,
                        error: 'File already registered on-chain',
                        onChainRecordIndex: file.onChainRecordIndex,
                        blockchainTxHash: file.blockchainTxHash
                    })
                    continue
                }

                // Register on blockchain
                const result = await registerGenomicData(file.pid, file.fileHash, file.fileId)
                
                // Update file with blockchain info
                await EncryptedFile.updateOne(
                    { fileId },
                    { 
                        $set: {
                            blockchainTxHash: result.txHash,
                            onChainRecordIndex: result.recordIndex
                        }
                    }
                )

                results.push({
                    fileId,
                    success: true,
                    onChainRecordIndex: result.recordIndex,
                    blockchainTxHash: result.txHash,
                    message: 'Successfully registered on blockchain'
                })

                console.log(`[Blockchain] Registered existing file: fileId=${fileId}, recordIndex=${result.recordIndex}, txHash=${result.txHash}`)

            } catch (error) {
                console.error(`[Blockchain] Failed to register file ${fileId}:`, error)
                results.push({
                    fileId,
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                })
            }
        }

        return NextResponse.json({ 
            success: true, 
            results,
            summary: {
                total: fileIds.length,
                successful: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length
            }
        })

    } catch (error) {
        console.error('Register blockchain error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
    try {
        await connectDB()

        const { searchParams } = new URL(request.url)
        const labId = searchParams.get('labId')

        // Get files that need registration
        let query: Record<string, any> = {}

        // Simple logic: If blockchain has no records, all files need re-registration
        try {
            const { isBlockchainAvailable, getOnChainRecordCount } = await import('@/lib/blockchain')
            if (await isBlockchainAvailable()) {
                const recordCount = await getOnChainRecordCount()
                console.log('[Registration API] Blockchain record count:', recordCount)
                
                if (recordCount === 0) {
                    // Blockchain is empty - all files need re-registration
                    console.log('[Registration API] Blockchain empty - all files need re-registration')
                    if (labId) {
                        query.labId = labId
                    }
                } else {
                    // Blockchain has records - find truly unregistered files
                    query = {
                        $or: [
                            { onChainRecordIndex: { $exists: false } },
                            { onChainRecordIndex: -1 },
                            { onChainRecordIndex: { $lt: 0 } }
                        ]
                    }
                    if (labId) {
                        query.labId = labId
                    }
                }
            } else {
                // Blockchain not available - get all files
                if (labId) {
                    query.labId = labId
                }
            }
        } catch (error) {
            console.error('[Registration API] Error checking blockchain:', error)
            // Fallback: get all files for the lab
            if (labId) {
                query.labId = labId
            }
        }

        const unregisteredFiles = await EncryptedFile.find(query)
            .select('fileId fileName pid fileHash labId uploadDate')
            .sort({ uploadDate: -1 })
            .lean()

        return NextResponse.json({ 
            success: true, 
            data: unregisteredFiles,
            count: unregisteredFiles.length
        })

    } catch (error) {
        console.error('Get unregistered files error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
