import mongoose, { Document, Schema } from 'mongoose'

export interface IAccessRequest extends Document {
    requestId: string
    pid: string
    researcherId: string
    researcherName: string
    institution: string
    genomicRecordId: string
    purpose: string
    durationDays: number
    status: 'Pending' | 'Approved' | 'Rejected'
    blockchainRequestId: string
    requestedAt: Date
    createdAt: Date
    updatedAt: Date
}

const accessRequestSchema = new Schema<IAccessRequest>({
    requestId: {
        type: String,
        required: true,
        unique: true
    },
    pid: {
        type: String,
        required: true
    },
    researcherId: {
        type: String,
        required: true
    },
    researcherName: {
        type: String,
        required: true
    },
    institution: {
        type: String,
        required: true
    },
    genomicRecordId: {
        type: String,
        required: true
    },
    purpose: {
        type: String,
        required: true
    },
    durationDays: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    blockchainRequestId: {
        type: String,
        required: true
    },
    requestedAt: {
        type: Date,
        required: true
    }
}, {
    timestamps: true
})

accessRequestSchema.index({ pid: 1 })
accessRequestSchema.index({ researcherId: 1 })
accessRequestSchema.index({ requestId: 1 })

export const AccessRequestModel = mongoose.models.AccessRequest || mongoose.model<IAccessRequest>('AccessRequest', accessRequestSchema)
