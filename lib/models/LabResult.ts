import mongoose, { Document, Schema } from 'mongoose'

export interface ILabResult extends Document {
  userId: mongoose.Types.ObjectId
  labId: string
  testName: string
  result: string
  status: string
  createdAt: Date
}

const labResultSchema = new Schema<ILabResult>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  labId: {
    type: String,
    required: true
  },
  testName: {
    type: String,
    required: true
  },
  result: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
})

labResultSchema.index({ userId: 1 })
labResultSchema.index({ labId: 1 })

export const LabResult = mongoose.models.LabResult || mongoose.model<ILabResult>('LabResult', labResultSchema)
