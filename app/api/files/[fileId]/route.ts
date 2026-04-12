import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { EncryptedFile } from '@/lib/models/EncryptedFile'
import { decryptData, verifySHA256 } from '@/lib/encryption'
import { verifyIntegrity } from '@/lib/blockchain'

export async function GET(request: NextRequest, { params }: { params: Promise<{ fileId: string }> }) {
    try {
        await connectDB()

        const { fileId } = await params
        const file = await EncryptedFile.findOne({ fileId })
        if (!file) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 })
        }

        // Decrypt file
        const decryptedData = decryptData(file.encryptedData, file.iv)

        // Verify integrity
        const isIntegrityValid = verifySHA256(decryptedData, file.fileHash)

        // If file has blockchain record, verify on-chain as well
        let blockchainValid = null
        if (file.onChainRecordIndex !== undefined && file.onChainRecordIndex >= 0) {
            try {
                blockchainValid = await verifyIntegrity(file.onChainRecordIndex, file.fileHash)
            } catch (error) {
                console.warn('[Blockchain] On-chain verification failed:', error)
                blockchainValid = false
            }
        }

        // Return decrypted file with metadata
        const uint8Array = new Uint8Array(decryptedData)
        return new NextResponse(uint8Array, {
            headers: {
                'Content-Type': file.fileType,
                'Content-Disposition': `attachment; filename="${file.fileName}"`,
                'X-File-Id': file.fileId,
                'X-File-Hash': file.fileHash,
                'X-Integrity-Valid': isIntegrityValid.toString(),
                'X-Blockchain-Valid': blockchainValid?.toString() || 'null',
                'X-PID': file.pid,
                'X-Lab-Id': file.labId,
                'X-Upload-Date': file.uploadDate.toISOString()
            }
        })
    } catch (error) {
        console.error('Download file error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ fileId: string }> }) {
    try {
        await connectDB()

        const { fileId } = await params
        const file = await EncryptedFile.findOneAndDelete({ fileId })
        if (!file) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 })
        }

        return NextResponse.json({ 
            success: true, 
            message: 'File deleted successfully',
            deletedFile: {
                fileId: file.fileId,
                fileName: file.fileName,
                pid: file.pid
            }
        })
    } catch (error) {
        console.error('Delete file error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
