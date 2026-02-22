import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { LabResult } from '@/lib/models/LabResult'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const labId = searchParams.get('labId')
    
    let query: any = {}
    if (userId) query.userId = userId
    if (labId) query.labId = labId
    
    const labResults = await LabResult.find(query).sort({ createdAt: -1 })
    
    return NextResponse.json({
      success: true,
      data: labResults
    })
    
  } catch (error) {
    console.error('Get lab results error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    
    const { userId, labId, testName, result, status } = await request.json()
    
    if (!userId || !labId || !testName || !result || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    const labResult = new LabResult({
      userId,
      labId,
      testName,
      result,
      status
    })
    
    await labResult.save()
    
    return NextResponse.json({
      success: true,
      data: labResult
    })
    
  } catch (error) {
    console.error('Create lab result error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
