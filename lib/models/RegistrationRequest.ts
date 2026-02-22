import mongoose, { Document, Schema } from 'mongoose'

export interface IRegistrationRequest extends Document {
    applicantAddress: string
    role: 'LAB' | 'RESEARCHER'
    name: string
    email: string
    password: string // bcrypt hashed
    institution?: string // researcher only
    proposalId: number // on-chain proposal ID
    status: 'pending' | 'approved' | 'rejected'
    txHash: string // proposal creation tx
    votes: Array<{
        voter: string
        approve: boolean
        txHash: string
        timestamp: Date
    }>
    expiresAt: Date
    createdAt: Date
    updatedAt: Date
}

const registrationRequestSchema = new Schema<IRegistrationRequest>({
    applicantAddress: {
        type: String,
        required: true,
        lowercase: true
    },
    role: {
        type: String,
        enum: ['LAB', 'RESEARCHER'],
        required: true
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
    password: {
        type: String,
        required: true
    },
    institution: {
        type: String
    },
    proposalId: {
        type: Number,
        required: true,
        unique: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    txHash: {
        type: String,
        required: true
    },
    votes: [{
        voter: { type: String, required: true },
        approve: { type: Boolean, required: true },
        txHash: { type: String, required: true },
        timestamp: { type: Date, default: Date.now }
    }],
    expiresAt: {
        type: Date,
        required: true
    }
}, {
    timestamps: true
})

registrationRequestSchema.index({ proposalId: 1 })
registrationRequestSchema.index({ status: 1 })
registrationRequestSchema.index({ applicantAddress: 1 })
registrationRequestSchema.index({ role: 1, status: 1 })

export const RegistrationRequest = mongoose.models.RegistrationRequest ||
    mongoose.model<IRegistrationRequest>('RegistrationRequest', registrationRequestSchema)
