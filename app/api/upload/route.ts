import { NextRequest, NextResponse } from 'next/server'
import { generateFileId, encryptData, calculateSHA256 } from '@/lib/encryption'
import { registerGenomicData, isBlockchainAvailable } from '@/lib/blockchain'
import connectDB from '@/lib/mongodb'
import { EncryptedFile } from '@/lib/models/EncryptedFile'
import { AuditEventModel } from '@/lib/models/AuditEvent'

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const formData = await request.formData()
    const file = formData.get('file') as File
    const pid = formData.get('pid') as string
    const labId = formData.get('labId') as string
    const labName = formData.get('labName') as string
    const fileType = formData.get('fileType') as string
    const tags = formData.get('tags') as string
    // Patient demographic information
    const patientAge = formData.get('patientAge') as string
    const patientGender = formData.get('patientGender') as string
    const geographicRegion = formData.get('geographicRegion') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!pid || !labId || !labName || !fileType) {
      return NextResponse.json({ error: 'Missing required metadata' }, { status: 400 })
    }

    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    
    // Calculate SHA-256 hash of original file
    const fileHash = calculateSHA256(fileBuffer)
    
    // Encrypt file with AES-256
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
      fileType,
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
      fileSize: file.size,
      // Patient demographic information
      patientAge: patientAge ? parseInt(patientAge) : undefined,
      patientGender: patientGender as 'Male' | 'Female' | 'Other' || undefined,
      geographicRegion: geographicRegion || undefined
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
      details: `${labName} uploaded encrypted file for ${pid} (${file.name}) - Age: ${patientAge || 'N/A'}, Gender: ${patientGender || 'N/A'}, Region: ${geographicRegion || 'N/A'}`
    })

    // Return successful upload result
    return NextResponse.json({
      success: true,
      data: {
        fileId,
        fileName: file.name,
        fileSize: file.size,
        fileType,
        pid,
        labId,
        labName,
        fileHash,
        blockchainTxHash,
        onChainRecordIndex,
        status: chainAvailable ? 'Registered' : 'Uploaded',
        uploadDate: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ 
      error: 'Upload failed', 
      details: (error as Error).message 
    }, { status: 500 })
  }
}

// GET endpoint for upload status and metadata
export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('fileId')
    const labId = searchParams.get('labId')
    const pid = searchParams.get('pid')

    if (fileId) {
      // Get specific file by ID
      const file = await EncryptedFile.findOne({ fileId })
      if (!file) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 })
      }
      // Return metadata only (exclude encrypted data)
      const { encryptedData, iv, ...metadata } = file.toObject()
      return NextResponse.json({ success: true, data: metadata })
    } else {
      // List files with filters
      const query: Record<string, string> = {}
      if (pid) query.pid = pid
      if (labId) query.labId = labId

      const files = await EncryptedFile.find(query)
        .sort({ uploadDate: -1 })
        .select('-encryptedData -iv') // Exclude binary data from list view
        .lean()

      return NextResponse.json({ success: true, data: files })
    }
  } catch (error) {
    console.error('Get upload files error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
