import mongoose, { Document, Schema } from 'mongoose'

export interface IConsent extends Document {
    consentId: string
    pid: string
    researcherId: string
    researcherName: string
    institution: string
    genomicRecordId: string
    consentStart: Date
    consentEnd: Date
    status: 'Active' | 'Revoked' | 'Expired'
    blockchainTxHash: string
    createdAt: Date
    updatedAt: Date
}

const consentSchema = new Schema<IConsent>({
    consentId: {
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
    consentStart: {
        type: Date,
        required: true
    },
    consentEnd: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['Active', 'Revoked', 'Expired'],
        default: 'Active'
    },
    blockchainTxHash: {
        type: String,
        required: true
    }
}, {
    timestamps: true
})

consentSchema.index({ pid: 1 })
consentSchema.index({ researcherId: 1 })
consentSchema.index({ consentId: 1 })

export const ConsentModel = mongoose.models.Consent || mongoose.model<IConsent>('Consent', consentSchema)
