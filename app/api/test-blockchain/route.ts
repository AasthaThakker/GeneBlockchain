import { NextResponse } from 'next/server'
import { getGenomicRecord, genomicRecordExists, isBlockchainAvailable } from '@/lib/blockchain'

export async function GET() {
    try {
        console.log("=== Testing Blockchain Functions ===")
        
        // Test blockchain availability
        const available = await isBlockchainAvailable()
        console.log("Blockchain available:", available)
        
        if (!available) {
            return NextResponse.json({
                success: false,
                error: 'Blockchain not available'
            })
        }
        
        // Test record existence
        const recordExists = await genomicRecordExists(0)
        console.log("Record 0 exists:", recordExists)
        
        if (!recordExists) {
            return NextResponse.json({
                success: false,
                error: 'Record 0 does not exist',
                available: true,
                recordExists: false
            })
        }
        
        // Test getting record
        try {
            const record = await getGenomicRecord(0)
            console.log("Record 0 retrieved successfully:", {
                pid: record.pid,
                fileHash: record.fileHash,
                fileId: record.fileId,
                registeredBy: record.registeredBy,
                timestamp: record.timestamp
            })
            
            return NextResponse.json({
                success: true,
                available: true,
                recordExists: true,
                record: {
                    pid: record.pid,
                    fileHash: record.fileHash,
                    fileId: record.fileId,
                    registeredBy: record.registeredBy,
                    timestamp: record.timestamp
                }
            })
        } catch (error: any) {
            console.error("Error getting record 0:", error)
            return NextResponse.json({
                success: false,
                error: error?.message || 'Unknown error getting record',
                available: true,
                recordExists: true
            })
        }
        
    } catch (error: any) {
        console.error('Test blockchain error:', error)
        return NextResponse.json({ 
            success: false, 
            error: error?.message || 'Unknown error' 
        }, { status: 500 })
    }
}
