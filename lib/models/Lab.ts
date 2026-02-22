import mongoose, { Document, Schema } from 'mongoose'

export interface ILab extends Document {
    labId: string
    name: string
    email: string
    walletAddress: string
    verificationStatus: boolean
    createdAt: Date
    updatedAt: Date
}

const labSchema = new Schema<ILab>({
    labId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },
    walletAddress: {
        type: String,
        required: true,
        lowercase: true
    },
    verificationStatus: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
})

labSchema.index({ labId: 1 })
labSchema.index({ walletAddress: 1 })

export const Lab = mongoose.models.Lab || mongoose.model<ILab>('Lab', labSchema)
