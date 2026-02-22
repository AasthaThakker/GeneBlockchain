import mongoose, { Document, Schema } from 'mongoose'

export interface IAccessLog extends Document {
  genomicDataId: mongoose.Types.ObjectId
  accessedBy: string
  accessType: string
  timestamp: Date
  ipfsHash?: string
}

const accessLogSchema = new Schema<IAccessLog>({
  genomicDataId: {
    type: Schema.Types.ObjectId,
    ref: 'GenomicData',
    required: true
  },
  accessedBy: {
    type: String,
    required: true
  },
  accessType: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  ipfsHash: {
    type: String,
    sparse: true
  }
})

accessLogSchema.index({ genomicDataId: 1 })
accessLogSchema.index({ timestamp: 1 })

export const AccessLog = mongoose.models.AccessLog || mongoose.model<IAccessLog>('AccessLog', accessLogSchema)
