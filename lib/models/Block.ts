import mongoose, { Document, Schema } from 'mongoose'

export interface IBlock extends Document {
    // Block Details
    blockNumber: number
    blockHash: string
    parentHash: string
    
    // Block Metadata
    timestamp: Date
    miner: string
    difficulty: string
    totalDifficulty: string
    size: number
    gasLimit: string
    gasUsed: string
    
    // Transaction Summary
    transactionCount: number
    transactionHashes: string[]
    
    // Network Info
    networkId: string
    
    // Timestamps
    createdAt: Date
    updatedAt: Date
}

const blockSchema = new Schema<IBlock>({
    // Block Details
    blockNumber: {
        type: Number,
        required: true,
        unique: true,
        index: true
    },
    blockHash: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    parentHash: {
        type: String,
        required: true
    },
    
    // Block Metadata
    timestamp: {
        type: Date,
        required: true,
        index: true
    },
    miner: {
        type: String,
        required: true
    },
    difficulty: {
        type: String,
        required: true
    },
    totalDifficulty: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    gasLimit: {
        type: String,
        required: true
    },
    gasUsed: {
        type: String,
        required: true
    },
    
    // Transaction Summary
    transactionCount: {
        type: Number,
        required: true
    },
    transactionHashes: [{
        type: String,
        index: true
    }],
    
    // Network Info
    networkId: {
        type: String,
        required: true,
        default: 'localhost'
    }
}, {
    timestamps: { createdAt: true, updatedAt: true }
})

// Indexes for performance
blockSchema.index({ timestamp: -1 })
blockSchema.index({ miner: 1 })
blockSchema.index({ gasUsed: 1 })

export const BlockModel = mongoose.models.Block || 
    mongoose.model<IBlock>('Block', blockSchema)
