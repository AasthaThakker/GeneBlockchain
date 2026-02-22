import mongoose, { Document, Schema } from 'mongoose'

export interface IResearchAccess extends Document {
  researcherId: mongoose.Types.ObjectId
  genomicDataId: mongoose.Types.ObjectId
  accessLevel: string
  purpose: string
  expiresAt?: Date
  createdAt: Date
}

const researchAccessSchema = new Schema<IResearchAccess>({
  researcherId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  genomicDataId: {
    type: Schema.Types.ObjectId,
    ref: 'GenomicData',
    required: true
  },
  accessLevel: {
    type: String,
    required: true
  },
  purpose: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
})

researchAccessSchema.index({ researcherId: 1, genomicDataId: 1 }, { unique: true })
researchAccessSchema.index({ researcherId: 1 })

export const ResearchAccess = mongoose.models.ResearchAccess || mongoose.model<IResearchAccess>('ResearchAccess', researchAccessSchema)
