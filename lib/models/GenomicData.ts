import mongoose, { Document, Schema } from 'mongoose'

export interface IGenomicData extends Document {
  userId: mongoose.Types.ObjectId
  dataHash: string
  dataType: string
  size: number
  isEncrypted: boolean
  ipfsHash?: string
  createdAt: Date
  updatedAt: Date
}

const genomicDataSchema = new Schema<IGenomicData>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dataHash: {
    type: String,
    required: true,
    unique: true
  },
  dataType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  isEncrypted: {
    type: Boolean,
    default: true
  },
  ipfsHash: {
    type: String,
    sparse: true
  }
}, {
  timestamps: true
})

genomicDataSchema.index({ userId: 1 })
genomicDataSchema.index({ dataHash: 1 })

export const GenomicData = mongoose.models.GenomicData || mongoose.model<IGenomicData>('GenomicData', genomicDataSchema)
