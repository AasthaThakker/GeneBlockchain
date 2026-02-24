import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { GenomicRecord } from '@/lib/models/GenomicRecord'
import { getIPFSGatewayURL, checkIPFSAvailability } from '@/lib/ipfs-cli'

export async function GET(request: NextRequest) {
    try {
        await connectDB()

        const { searchParams } = new URL(request.url)
        const pid = searchParams.get('pid')
        const labId = searchParams.get('labId')

        const query: Record<string, string> = {}
        if (pid) query.pid = pid
        if (labId) query.labId = labId

        const records = await GenomicRecord.find(query)
            .sort({ uploadDate: -1 })
            .lean()

        const ipfsAvailable = await checkIPFSAvailability()

        const files = (records as any[]).map((record) => ({
            recordId: record.recordId,
            pid: record.pid,
            labId: record.labId,
            labName: record.labName,
            fileType: record.fileType,
            ipfsCID: record.ipfsCID,
            fileHash: record.fileHash,
            encrypted: true, // All files are encrypted with AES-256
            uploadDate: record.uploadDate,
            status: record.status,
            blockchainTxHash: record.blockchainTxHash,
            gatewayUrl: record.ipfsCID ? getIPFSGatewayURL(record.ipfsCID) : null,
            ipfsAvailable,
        }))

        return NextResponse.json({
            success: true,
            data: files,
            summary: {
                totalFiles: files.length,
                totalEncrypted: files.filter((f) => f.encrypted).length,
                ipfsNodeOnline: ipfsAvailable,
            },
        })
    } catch (error) {
        console.error('IPFS files listing error:', error)
        return NextResponse.json(
            { error: 'Failed to list IPFS files' },
            { status: 500 }
        )
    }
}
