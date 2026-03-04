import mongoose, { Document, Schema } from 'mongoose'

export interface IBlockchainTransaction extends Document {
    // Transaction Details
    txHash: string
    blockNumber: number
    blockHash: string
    transactionIndex: number
    
    // Gas Information
    gasUsed: string
    gasPrice: string
    gasLimit: string
    effectiveGasPrice: string
    maxFeePerGas?: string
    maxPriorityFeePerGas?: string
    
    // Transaction Details
    from: string
    to: string
    value: string
    data: string
    nonce: number
    
    // Status & Timing
    status: boolean // success/failure
    timestamp: Date
    confirmations: number
    
    // Contract Interaction Details
    contractAddress?: string
    functionName?: string
    functionParameters?: any
    
    // Event Information
    events: Array<{
        name: string
        signature: string
        args: any
        address: string
        logIndex: number
    }>
    
    // System Integration
    auditEventId?: mongoose.Types.ObjectId
    relatedEntity?: {
        type: 'GenomicData' | 'Consent' | 'AccessLog' | 'Registration'
        id: mongoose.Types.ObjectId
    }
    
    // Metadata
    networkId: string
    createdAt: Date
    updatedAt: Date
}

const blockchainTransactionSchema = new Schema<IBlockchainTransaction>({
    // Transaction Details
    txHash: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    blockNumber: {
        type: Number,
        required: true,
        index: true
    },
    blockHash: {
        type: String,
        required: true
    },
    transactionIndex: {
        type: Number,
        required: true
    },
    
    // Gas Information
    gasUsed: {
        type: String,
        required: true
    },
    gasPrice: {
        type: String,
        required: true
    },
    gasLimit: {
        type: String,
        required: true
    },
    effectiveGasPrice: {
        type: String,
        required: true
    },
    maxFeePerGas: String,
    maxPriorityFeePerGas: String,
    
    // Transaction Details
    from: {
        type: String,
        required: true,
        index: true
    },
    to: {
        type: String,
        required: true,
        index: true
    },
    value: {
        type: String,
        required: true
    },
    data: {
        type: String,
        required: true
    },
    nonce: {
        type: Number,
        required: true
    },
    
    // Status & Timing
    status: {
        type: Boolean,
        required: true,
        index: true
    },
    timestamp: {
        type: Date,
        required: true,
        index: true
    },
    confirmations: {
        type: Number,
        required: true
    },
    
    // Contract Interaction Details
    contractAddress: {
        type: String,
        index: true
    },
    functionName: String,
    functionParameters: Schema.Types.Mixed,
    
    // Event Information
    events: [{
        name: String,
        signature: String,
        args: Schema.Types.Mixed,
        address: String,
        logIndex: Number
    }],
    
    // System Integration
    auditEventId: {
        type: Schema.Types.ObjectId,
        ref: 'AuditEvent',
        index: true
    },
    relatedEntity: {
        type: {
            type: String,
            enum: ['GenomicData', 'Consent', 'AccessLog', 'Registration']
        },
        id: {
            type: Schema.Types.ObjectId,
            refPath: 'relatedEntity.type'
        }
    },
    
    // Metadata
    networkId: {
        type: String,
        required: true,
        default: 'localhost'
    }
}, {
    timestamps: { createdAt: true, updatedAt: true }
})

// Indexes for performance
blockchainTransactionSchema.index({ blockNumber: -1 })
blockchainTransactionSchema.index({ timestamp: -1 })
blockchainTransactionSchema.index({ from: 1, timestamp: -1 })
blockchainTransactionSchema.index({ to: 1, timestamp: -1 })
blockchainTransactionSchema.index({ 'events.name': 1 })
blockchainTransactionSchema.index({ functionName: 1 })

export const BlockchainTransactionModel = mongoose.models.BlockchainTransaction || 
    mongoose.model<IBlockchainTransaction>('BlockchainTransaction', blockchainTransactionSchema)
