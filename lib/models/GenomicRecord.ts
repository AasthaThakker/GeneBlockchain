import mongoose, { Document, Schema } from 'mongoose'

export interface IGenomicRecord extends Document {
    recordId: string
    pid: string
    labId: string
    labName: string
    fileType: 'VCF' | 'FASTA'
    ipfsCID: string
    fileHash: string
    blockchainTxHash: string
    uploadDate: Date
    status: 'Registered' | 'Pending' | 'Verified'
    tags: string[]
    createdAt: Date
    updatedAt: Date
}

const genomicRecordSchema = new Schema<IGenomicRecord>({
    recordId: {
        type: String,
        required: true,
        unique: true
    },
    pid: {
        type: String,
        required: true
    },
    labId: {
        type: String,
        required: true
    },
    labName: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        enum: ['VCF', 'FASTA'],
        required: true
    },
    ipfsCID: {
        type: String,
        required: true
    },
    fileHash: {
        type: String,
        required: true
    },
    blockchainTxHash: {
        type: String,
        required: true
    },
    uploadDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['Registered', 'Pending', 'Verified'],
        default: 'Registered'
    },
    tags: [{
        type: String
    }]
}, {
    timestamps: true
})

genomicRecordSchema.index({ pid: 1 })
genomicRecordSchema.index({ labId: 1 })
genomicRecordSchema.index({ recordId: 1 })

export const GenomicRecord = mongoose.models.GenomicRecord || mongoose.model<IGenomicRecord>('GenomicRecord', genomicRecordSchema)
