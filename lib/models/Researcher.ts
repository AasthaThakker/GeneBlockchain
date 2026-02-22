import mongoose, { Document, Schema } from 'mongoose'

export interface IResearcher extends Document {
    researcherId: string
    name: string
    institution: string
    email: string
    walletAddress: string
    verificationStatus: boolean
    createdAt: Date
    updatedAt: Date
}

const researcherSchema = new Schema<IResearcher>({
    researcherId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    institution: {
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

researcherSchema.index({ researcherId: 1 })
researcherSchema.index({ walletAddress: 1 })

export const Researcher = mongoose.models.Researcher || mongoose.model<IResearcher>('Researcher', researcherSchema)
