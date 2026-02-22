import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { GenomicData } from '@/lib/models/GenomicData'
import { AccessLog } from '@/lib/models/AccessLog'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
    
    const genomicData = await GenomicData.find({ userId }).sort({ createdAt: -1 })
    
    return NextResponse.json({
      success: true,
      data: genomicData
    })
    
  } catch (error) {
    console.error('Get genomic data error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const { userId, dataHash, dataType, size, ipfsHash } = await request.json()
    
    if (!userId || !dataHash || !dataType || !size) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    const existingData = await GenomicData.findOne({ dataHash })
    if (existingData) {
      return NextResponse.json({ error: 'Data with this hash already exists' }, { status: 400 })
    }
    
    const genomicData = new GenomicData({
      userId,
      dataHash,
      dataType,
      size,
      ipfsHash,
      isEncrypted: true
    })
    
    await genomicData.save()
    
    await AccessLog.create({
      genomicDataId: genomicData._id,
      accessedBy: userId,
      accessType: 'UPLOAD',
      ipfsHash
    })
    
    return NextResponse.json({
      success: true,
      data: genomicData
    })
    
  } catch (error) {
    console.error('Create genomic data error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
