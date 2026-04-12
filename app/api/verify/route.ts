import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { EncryptedFile } from '@/lib/models/EncryptedFile'
import { decryptData, verifySHA256 } from '@/lib/encryption'
import { verifyIntegrity } from '@/lib/blockchain'

export async function POST(request: NextRequest) {
    try {
        await connectDB()

        const body = await request.json()
        const { fileIds, fileId, recordIndex } = body

        let verificationResults = []

        // Handle batch verification by fileIds
        if (fileIds && Array.isArray(fileIds)) {
            for (const id of fileIds) {
                const file = await EncryptedFile.findOne({ fileId: id })
                if (!file) {
                    verificationResults.push({
                        fileId: id,
                        error: 'File not found',
                        overallStatus: false
                    })
                    continue
                }

                // Decrypt and verify local integrity
                const decryptedData = decryptData(file.encryptedData, file.iv)
                const localIntegrity = verifySHA256(decryptedData, file.fileHash)

                // Verify on-chain if record exists
                let blockchainIntegrity = null
                let blockchainHash = null
                if (file.onChainRecordIndex !== undefined && file.onChainRecordIndex >= 0) {
                    try {
                        // Get on-chain record to compare hashes
                        const { getGenomicRecord } = await import('@/lib/blockchain')
                        const onChainRecord = await getGenomicRecord(file.onChainRecordIndex)
                        blockchainHash = onChainRecord.fileHash
                        
                        // Compare MongoDB hash with blockchain hash
                        blockchainIntegrity = file.fileHash === blockchainHash
                    } catch (error) {
                        console.warn('[Blockchain] On-chain verification failed:', error)
                        blockchainIntegrity = false
                    }
                }

                verificationResults.push({
                    fileId: id,
                    fileName: file.fileName,
                    pid: file.pid,
                    fileHash: file.fileHash,
                    blockchainHash,
                    localIntegrity,
                    blockchainIntegrity,
                    overallStatus: localIntegrity && (blockchainIntegrity === null || blockchainIntegrity),
                    onChainRecordIndex: file.onChainRecordIndex,
                    blockchainTxHash: file.blockchainTxHash
                })
            }
        }

        // Handle single file verification
        if (fileId && !fileIds) {
            const file = await EncryptedFile.findOne({ fileId })
            if (!file) {
                return NextResponse.json({ error: 'File not found' }, { status: 404 })
            }

            // Decrypt and verify local integrity
            const decryptedData = decryptData(file.encryptedData, file.iv)
            const localIntegrity = verifySHA256(decryptedData, file.fileHash)

            // Verify on-chain if record exists
            let blockchainIntegrity = null
            let blockchainHash = null
            if (file.onChainRecordIndex !== undefined && file.onChainRecordIndex >= 0) {
                try {
                    // Get on-chain record to compare hashes
                    const { getGenomicRecord } = await import('@/lib/blockchain')
                    const onChainRecord = await getGenomicRecord(file.onChainRecordIndex)
                    blockchainHash = onChainRecord.fileHash
                    
                    // Compare MongoDB hash with blockchain hash
                    blockchainIntegrity = file.fileHash === blockchainHash
                } catch (error) {
                    console.warn('[Blockchain] On-chain verification failed:', error)
                    blockchainIntegrity = false
                }
            }

            verificationResults.push({
                fileId,
                fileName: file.fileName,
                pid: file.pid,
                fileHash: file.fileHash,
                blockchainHash,
                localIntegrity,
                blockchainIntegrity,
                overallStatus: localIntegrity && (blockchainIntegrity === null || blockchainIntegrity),
                onChainRecordIndex: file.onChainRecordIndex,
                blockchainTxHash: file.blockchainTxHash
            })
        }

        if (recordIndex !== undefined) {
            // Verify specific record by blockchain index
            try {
                const file = await EncryptedFile.findOne({ onChainRecordIndex: recordIndex })
                if (!file) {
                    return NextResponse.json({ 
                        error: `No file found for blockchain record index ${recordIndex}` 
                    }, { status: 404 })
                }

                // Decrypt and verify local integrity
                const decryptedData = decryptData(file.encryptedData, file.iv)
                const localIntegrity = verifySHA256(decryptedData, file.fileHash)

                // Verify on-chain
                const blockchainIntegrity = await verifyIntegrity(recordIndex, file.fileHash)

                verificationResults.push({
                    fileId: file.fileId,
                    fileName: file.fileName,
                    pid: file.pid,
                    fileHash: file.fileHash,
                    localIntegrity,
                    blockchainIntegrity,
                    overallStatus: localIntegrity && blockchainIntegrity,
                    onChainRecordIndex: recordIndex,
                    blockchainTxHash: file.blockchainTxHash
                })
            } catch (error) {
                console.error('[Blockchain] Verification failed for record index:', recordIndex, error)
                verificationResults.push({
                    recordIndex,
                    error: 'Blockchain verification failed',
                    overallStatus: false
                })
            }
        }

        return NextResponse.json({ 
            success: true, 
            verificationResults,
            summary: {
                total: verificationResults.length,
                passed: verificationResults.filter(r => r.overallStatus).length,
                failed: verificationResults.filter(r => !r.overallStatus).length
            }
        })
    } catch (error) {
        console.error('Verification error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
    try {
        await connectDB()

        const { searchParams } = new URL(request.url)
        const labId = searchParams.get('labId')
        const pid = searchParams.get('pid')

        const query: Record<string, string> = {}
        if (labId) query.labId = labId
        if (pid) query.pid = pid

        // Get all files for batch verification
        const files = await EncryptedFile.find(query)
            .sort({ uploadDate: -1 })
            .select('-encryptedData -iv') // Exclude binary data
            .lean()

        return NextResponse.json({ 
            success: true, 
            data: files,
            message: 'Use POST to verify integrity of these files'
        })
    } catch (error) {
        console.error('Get verification files error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
