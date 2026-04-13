import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { EncryptedFile } from '@/lib/models/EncryptedFile'
import { decryptData } from '@/lib/encryption'

export async function GET(request: NextRequest) {
    try {
        await connectDB()

        const { searchParams } = new URL(request.url)
        const fileId = searchParams.get('fileId')

        if (!fileId) {
            // List all available files
            const files = await EncryptedFile.find({})
                .select('fileId fileName pid fileType fileSize uploadDate')
                .sort({ uploadDate: -1 })
                .lean()

            return NextResponse.json({
                success: true,
                files: files.map(file => ({
                    fileId: file.fileId,
                    fileName: file.fileName,
                    pid: file.pid,
                    fileType: file.fileType,
                    fileSize: file.fileSize,
                    uploadDate: file.uploadDate
                }))
            })
        }

        // Get specific file content
        const file = await EncryptedFile.findOne({ fileId })
        if (!file) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 })
        }

        // Decrypt the file content
        const decryptedContent = decryptData(file.encryptedData, file.iv)
        const contentString = decryptedContent.toString()

        return NextResponse.json({
            success: true,
            file: {
                fileId: file.fileId,
                fileName: file.fileName,
                pid: file.pid,
                fileType: file.fileType,
                fileSize: file.fileSize,
                uploadDate: file.uploadDate,
                content: contentString
            }
        })

    } catch (error: any) {
        console.error('View genomic data error:', error)
        return NextResponse.json({ 
            error: 'Internal server error',
            message: error.message 
        }, { status: 500 })
    }
}
