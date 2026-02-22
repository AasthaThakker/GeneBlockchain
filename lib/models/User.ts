import mongoose, { Document, Schema } from 'mongoose'

export interface IUser extends Document {
  email?: string
  password?: string
  role: 'PATIENT' | 'LAB' | 'RESEARCHER'
  walletAddress: string
  isAdmin: boolean
  displayName?: string
  pid?: string
  labId?: string
  researcherId?: string
  createdAt: Date
  updatedAt: Date
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    sparse: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String
  },
  role: {
    type: String,
    enum: ['PATIENT', 'LAB', 'RESEARCHER'],
    required: true
  },
  walletAddress: {
    type: String,
    required: true,
    lowercase: true
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  displayName: {
    type: String
  },
  pid: {
    type: String
  },
  labId: {
    type: String
  },
  researcherId: {
    type: String
  }
}, {
  timestamps: true
})

userSchema.index({ walletAddress: 1, role: 1 }, { unique: true })
userSchema.index({ email: 1, role: 1 }, { sparse: true })
userSchema.index({ pid: 1 }, { sparse: true })
userSchema.index({ labId: 1 }, { sparse: true })
userSchema.index({ researcherId: 1 }, { sparse: true })

export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema)
