import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { EncryptedFile } from '@/lib/models/EncryptedFile'
import { AuditEventModel } from '@/lib/models/AuditEvent'
import { registerGenomicData, isBlockchainAvailable } from '@/lib/blockchain'

export async function GET(request: NextRequest) {
    try {
        await connectDB()

        const { searchParams } = new URL(request.url)
        const pid = searchParams.get('pid')
        const labId = searchParams.get('labId')

        const query: Record<string, string> = {}
        if (pid) query.pid = pid
        if (labId) query.labId = labId

        const records = await EncryptedFile.find(query)
        .sort({ uploadDate: -1 })
        .select('-encryptedData -iv') // Exclude binary data from list view
        .lean()

        return NextResponse.json({ success: true, data: records })
    } catch (error) {
        console.error('Get genomic records error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        await connectDB()

        const body = await request.json()
        const { pid, labId, labName, fileType, fileId, fileHash, tags } = body

        if (!pid || !labId || !labName || !fileType || !fileId || !fileHash) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Register on blockchain
        let blockchainTxHash = ''
        let onChainRecordIndex = -1
        const chainAvailable = await isBlockchainAvailable()

        if (chainAvailable) {
            const result = await registerGenomicData(pid, fileHash, fileId)
            blockchainTxHash = result.txHash
            onChainRecordIndex = result.recordIndex
            console.log(`[Blockchain] GenomicData registered: txHash=${blockchainTxHash}, recordIndex=${onChainRecordIndex}`)
        } else {
            blockchainTxHash = `0xOFFLINE_${Date.now().toString(16)}`
            console.warn('[Blockchain] Node unavailable — using offline txHash')
        }

        const count = await EncryptedFile.countDocuments()
        const recordId = `GR-${String(count + 1).padStart(3, '0')}`

        // Update existing encrypted file with blockchain info
        const record = await EncryptedFile.findOneAndUpdate(
            { fileId },
            { 
                blockchainTxHash,
                onChainRecordIndex,
                status: chainAvailable ? 'Registered' : 'Uploaded'
            },
            { new: true }
        )

        if (!record) {
            return NextResponse.json({ error: 'File not found. Upload file first.' }, { status: 404 })
        }

        // Create audit event
        const auditCount = await AuditEventModel.countDocuments()
        await AuditEventModel.create({
            eventId: `AE-${String(auditCount + 1).padStart(3, '0')}`,
            timestamp: new Date(),
            action: 'GenomicDataRegistered',
            actor: labId,
            actorRole: 'Lab',
            target: fileId,
            txHash: blockchainTxHash,
            details: `${labName} registered ${fileType} file for ${pid}`
        })

        return NextResponse.json({ success: true, data: record })
    } catch (error) {
        console.error('Create genomic record error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
