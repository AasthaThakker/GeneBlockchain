import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { GenomicRecord } from '@/lib/models/GenomicRecord'
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

        const records = await GenomicRecord.find(query).sort({ uploadDate: -1 }).lean()

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
        const { pid, labId, labName, fileType, ipfsCID, fileHash, tags } = body

        if (!pid || !labId || !labName || !fileType || !ipfsCID || !fileHash) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Register on blockchain
        let blockchainTxHash = ''
        let onChainRecordIndex = -1
        const chainAvailable = await isBlockchainAvailable()

        if (chainAvailable) {
            const result = await registerGenomicData(pid, fileHash, ipfsCID)
            blockchainTxHash = result.txHash
            onChainRecordIndex = result.recordIndex
            console.log(`[Blockchain] GenomicData registered: txHash=${blockchainTxHash}, recordIndex=${onChainRecordIndex}`)
        } else {
            blockchainTxHash = `0xOFFLINE_${Date.now().toString(16)}`
            console.warn('[Blockchain] Node unavailable — using offline txHash')
        }

        const count = await GenomicRecord.countDocuments()
        const recordId = `GR-${String(count + 1).padStart(3, '0')}`

        const record = new GenomicRecord({
            recordId,
            pid,
            labId,
            labName,
            fileType,
            ipfsCID,
            fileHash,
            blockchainTxHash,
            onChainRecordIndex,
            uploadDate: new Date(),
            status: 'Registered',
            tags: tags || []
        })

        await record.save()

        // Create audit event
        const auditCount = await AuditEventModel.countDocuments()
        await AuditEventModel.create({
            eventId: `AE-${String(auditCount + 1).padStart(3, '0')}`,
            timestamp: new Date(),
            action: 'GenomicDataRegistered',
            actor: labId,
            actorRole: 'Lab',
            target: recordId,
            txHash: blockchainTxHash,
            details: `${labName} uploaded ${fileType} file for ${pid}`
        })

        return NextResponse.json({ success: true, data: record })
    } catch (error) {
        console.error('Create genomic record error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
