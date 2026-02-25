import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// IPFS functions with fallback for when library is not installed
let ipfsFunctions: {
  uploadToIPFS: Function
  checkIPFSAvailability: Function
  pinToIPFS: Function
  downloadFromIPFS: Function
} | null = null

// Try to load IPFS functions
try {
  const ipfsModule = require('@/lib/ipfs-http.js')
  ipfsFunctions = {
    uploadToIPFS: ipfsModule.uploadToIPFS,
    checkIPFSAvailability: ipfsModule.checkIPFSAvailability,
    pinToIPFS: ipfsModule.pinToIPFS,
    downloadFromIPFS: ipfsModule.downloadFromIPFS
  }
  console.log('✅ IPFS HTTP module loaded successfully')
} catch (error) {
  console.warn('IPFS HTTP module not available. Please install IPFS daemon and ensure it is running on port 5001.')
  console.error('Module loading error:', error)
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const pid = formData.get('pid') as string
    const labId = formData.get('labId') as string
    const labName = formData.get('labName') as string
    const fileType = formData.get('fileType') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!pid || !labId || !labName || !fileType) {
      return NextResponse.json({ error: 'Missing required metadata' }, { status: 400 })
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Generate file hash (SHA-256)
    const fileHash = crypto.createHash('sha256').update(buffer).digest('hex')
    
    // Check IPFS availability
    const ipfsAvailable = ipfsFunctions ? await ipfsFunctions.checkIPFSAvailability() : false
    
    let ipfsCID = ''
    let encrypted = false
    
    if (ipfsAvailable) {
      try {
        // Upload to IPFS with encryption
        const encryptionKey = process.env.IPFS_ENCRYPTION_KEY
        const uploadResult = await ipfsFunctions!.uploadToIPFS(buffer, file.name, encryptionKey)
        ipfsCID = uploadResult.cid
        encrypted = uploadResult.encrypted
        
        // Pin the file to prevent garbage collection
        await ipfsFunctions!.pinToIPFS(ipfsCID)
        
        console.log(`[IPFS] Upload successful: CID=${ipfsCID}, encrypted=${encrypted}`)
      } catch (ipfsError) {
        console.error('IPFS upload failed:', ipfsError)
        return NextResponse.json({ 
          error: 'IPFS upload failed', 
          details: (ipfsError as Error).message 
        }, { status: 500 })
      }
    } else {
      return NextResponse.json({ 
        error: 'IPFS not available',
        message: 'IPFS daemon not running on port 5001',
        suggestion: '1. Install IPFS: Download from https://dist.ipfs.tech/kubo/v0.28.0/kubo_v0.28.0_windows-amd64.zip\n2. Add to PATH\n3. Run: ipfs init\n4. Run: ipfs daemon --api 127.0.0.1:5001'
      }, { status: 503 })
    }

    // Return successful upload result
    return NextResponse.json({
      success: true,
      data: {
        fileName: file.name,
        fileSize: file.size,
        fileType,
        pid,
        labId,
        labName,
        fileHash,
        ipfsCID,
        encrypted,
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

// Helper function to get file from IPFS
export async function GET(request: NextRequest) {
  try {
    if (!ipfsFunctions) {
      return NextResponse.json({ 
        error: 'IPFS not available',
        message: 'IPFS HTTP client not available',
        suggestion: 'Ensure IPFS daemon is running on port 5001 and HTTP API is enabled'
      }, { status: 503 })
    }

    const { searchParams } = new URL(request.url)
    const cid = searchParams.get('cid')
    const decryptionKey = searchParams.get('decrypt') === 'true' ? process.env.IPFS_ENCRYPTION_KEY : undefined

    if (!cid) {
      return NextResponse.json({ error: 'CID parameter required' }, { status: 400 })
    }

    // Download from IPFS
    const fileBuffer = await ipfsFunctions.downloadFromIPFS(cid, decryptionKey)
    
    // Return file as response
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${cid}"`
      }
    })

  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json({ 
      error: 'Download failed', 
      details: (error as Error).message 
    }, { status: 500 })
  }
}
