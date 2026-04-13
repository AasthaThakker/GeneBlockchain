import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { EncryptedFile } from '@/lib/models/EncryptedFile'
import { User } from '@/lib/models/User'
import { generateFileId, encryptData, calculateSHA256 } from '@/lib/encryption'
import { registerGenomicData, isBlockchainAvailable } from '@/lib/blockchain'
import { AuditEventModel } from '@/lib/models/AuditEvent'

export async function GET(request: NextRequest) {
    try {
        await connectDB()

        const { searchParams } = new URL(request.url)
        const fileId = searchParams.get('fileId')
        const pid = searchParams.get('pid')
        const labId = searchParams.get('labId')

        if (fileId) {
            // Get specific file by ID
            const file = await EncryptedFile.findOne({ fileId })
            if (!file) {
                return NextResponse.json({ error: 'File not found' }, { status: 404 })
            }
            return NextResponse.json({ success: true, data: file })
        } else {
            // List files with filters
            const query: Record<string, string> = {}
            if (pid) query.pid = pid
            if (labId) query.labId = labId

            const files = await EncryptedFile.find(query)
                .sort({ uploadDate: -1 })
                .select('-encryptedData -iv') // Exclude binary data from list view
                .lean()

            // Get patient demographic information for each file
            const filesWithPatientInfo = await Promise.all(
                files.map(async (file) => {
                    const patient = await User.findOne({ pid: file.pid, role: 'PATIENT' })
                        .select('age gender geographicRegion chronicDiseases medications familyHistory')
                        .lean()
                    
                    return {
                        ...file,
                        patientInfo: patient || {}
                    }
                })
            )

            return NextResponse.json({ success: true, data: filesWithPatientInfo })
        }
    } catch (error) {
        console.error('Get files error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        await connectDB()

        const formData = await request.formData()
        const file = formData.get('file') as File
        const pid = formData.get('pid') as string
        const labId = formData.get('labId') as string
        const labName = formData.get('labName') as string
        const tags = formData.get('tags') as string

        if (!file || !pid || !labId || !labName) {
            return NextResponse.json({ 
                error: 'Missing required fields: file, pid, labId, labName' 
            }, { status: 400 })
        }

        // Convert file to buffer
        const fileBuffer = Buffer.from(await file.arrayBuffer())
        
        // Calculate SHA-256 hash of original file
        const fileHash = calculateSHA256(fileBuffer)
        
        // Encrypt the file
        const { encrypted, iv } = encryptData(fileBuffer)
        
        // Generate unique file ID
        const fileId = generateFileId()

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

        // Create encrypted file record
        const encryptedFile = new EncryptedFile({
            fileId,
            fileName: file.name,
            fileType: file.type || 'application/octet-stream',
            encryptedData: encrypted,
            iv,
            fileHash,
            pid,
            labId,
            labName,
            blockchainTxHash,
            onChainRecordIndex,
            status: chainAvailable ? 'Registered' : 'Uploaded',
            tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
            fileSize: file.size
        })

        await encryptedFile.save()

        // Create audit event
        const auditCount = await AuditEventModel.countDocuments()
        await AuditEventModel.create({
            eventId: `AE-${String(auditCount + 1).padStart(3, '0')}`,
            timestamp: new Date(),
            action: 'FileUploaded',
            actor: labId,
            actorRole: 'Lab',
            target: fileId,
            txHash: blockchainTxHash,
            details: `${labName} uploaded encrypted file for ${pid} (${file.name})`
        })

        return NextResponse.json({ 
            success: true, 
            data: {
                fileId,
                fileName: file.name,
                fileHash,
                blockchainTxHash,
                onChainRecordIndex,
                status: chainAvailable ? 'Registered' : 'Uploaded'
            }
        })
    } catch (error) {
        console.error('Upload file error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
