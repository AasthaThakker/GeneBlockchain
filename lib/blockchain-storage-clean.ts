import mongoose from 'mongoose';

// Types for better TypeScript support
interface ITransactionData {
    txHash: string;
    blockNumber?: number;
    blockHash?: string;
    transactionIndex?: number;
    gasUsed: string;
    gasPrice: string;
    gasLimit: string;
    from: string;
    to: string;
    value: string;
    data: string;
    nonce: number;
    status: boolean;
    timestamp: Date;
    confirmations?: number;
    contractAddress?: string;
    functionName?: string;
    functionParameters?: any;
    events?: any[];
    auditEventId?: any;
    relatedEntity?: any;
    networkId: string;
}

interface IBlockData {
    blockNumber: number;
    blockHash: string;
    parentHash: string;
    timestamp: Date;
    miner: string;
    difficulty: string;
    totalDifficulty: string;
    size: number;
    gasLimit: string;
    gasUsed: string;
    transactionCount: number;
    transactionHashes: string[];
    networkId: string;
}

interface IBlockchainStats {
    totalTransactions: number;
    totalBlocks: number;
    totalGasUsed: string;
    successRate: number;
    recentTransactions: any[];
}

/**
 * Store comprehensive blockchain transaction details in MongoDB
 */
export async function storeTransaction(txData: ITransactionData): Promise<any> {
    try {
        // Ensure connection
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect('mongodb://localhost:27017/genomic-data-platform');
        }
        
        const db = mongoose.connection.db;
        if (!db) {
            throw new Error('Database not connected');
        }
        
        const result = await db.collection('blockchaintransactions').insertOne({
            ...txData,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        
        console.log(`[BlockchainStorage] Stored transaction ${txData.txHash}`);
        return result.insertedId;
    } catch (error: any) {
        console.error('[BlockchainStorage] Failed to store transaction:', error?.message || error);
        throw error;
    }
}

/**
 * Store block information in MongoDB
 */
export async function storeBlock(blockData: IBlockData): Promise<any> {
    try {
        // Ensure connection
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect('mongodb://localhost:27017/genomic-data-platform');
        }
        
        const db = mongoose.connection.db;
        if (!db) {
            throw new Error('Database not connected');
        }
        
        const result = await db.collection('blocks').insertOne({
            ...blockData,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        
        console.log(`[BlockchainStorage] Stored block ${blockData.blockNumber}`);
        return result.insertedId;
    } catch (error: any) {
        console.error(`[BlockchainStorage] Failed to store block ${blockData.blockNumber}:`, error?.message || error);
        throw error;
    }
}

/**
 * Get transaction with full details
 */
export async function getTransactionDetails(txHash: string): Promise<any> {
    try {
        // Ensure connection
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect('mongodb://localhost:27017/genomic-data-platform');
        }
        
        const db = mongoose.connection.db;
        if (!db) {
            return null;
        }
        
        return await db.collection('blockchaintransactions').findOne({ txHash });
    } catch (error: any) {
        console.error(`[BlockchainStorage] Failed to get transaction ${txHash}:`, error?.message || error);
        return null;
    }
}

/**
 * Get block with full details
 */
export async function getBlockDetails(blockNumber: number): Promise<any> {
    try {
        // Ensure connection
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect('mongodb://localhost:27017/genomic-data-platform');
        }
        
        const db = mongoose.connection.db;
        if (!db) {
            return null;
        }
        
        return await db.collection('blocks').findOne({ blockNumber });
    } catch (error: any) {
        console.error(`[BlockchainStorage] Failed to get block ${blockNumber}:`, error?.message || error);
        return null;
    }
}

/**
 * Get transactions by address
 */
export async function getTransactionsByAddress(
    address: string, 
    limit: number = 50, 
    offset: number = 0
): Promise<any[]> {
    try {
        // Ensure connection
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect('mongodb://localhost:27017/genomic-data-platform');
        }
        
        const db = mongoose.connection.db;
        if (!db) {
            return [];
        }
        
        return await db.collection('blockchaintransactions')
            .find({
                $or: [{ from: address }, { to: address }]
            })
            .sort({ timestamp: -1 })
            .limit(limit)
            .skip(offset)
            .toArray();
    } catch (error: any) {
        console.error(`[BlockchainStorage] Failed to get transactions for ${address}:`, error?.message || error);
        return [];
    }
}

/**
 * Get transactions by function name
 */
export async function getTransactionsByFunction(
    functionName: string,
    limit: number = 50,
    offset: number = 0
): Promise<any[]> {
    try {
        // Ensure connection
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect('mongodb://localhost:27017/genomic-data-platform');
        }
        
        const db = mongoose.connection.db;
        if (!db) {
            return [];
        }
        
        return await db.collection('blockchaintransactions')
            .find({ functionName })
            .sort({ timestamp: -1 })
            .limit(limit)
            .skip(offset)
            .toArray();
    } catch (error: any) {
        console.error(`[BlockchainStorage] Failed to get transactions for function ${functionName}:`, error?.message || error);
        return [];
    }
}

/**
 * Get blockchain statistics
 */
export async function getBlockchainStats(): Promise<IBlockchainStats> {
    try {
        // Ensure connection
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect('mongodb://localhost:27017/genomic-data-platform');
        }
        
        const db = mongoose.connection.db;
        if (!db) {
            return {
                totalTransactions: 0,
                totalBlocks: 0,
                totalGasUsed: '0',
                successRate: 0,
                recentTransactions: []
            };
        }
        
        const totalTransactions = await db.collection('blockchaintransactions').countDocuments();
        const totalBlocks = await db.collection('blocks').countDocuments();
        
        const gasStats = await db.collection('blockchaintransactions').aggregate([
            { $group: { _id: null, totalGas: { $sum: '$gasUsed' } } }
        ]).toArray();
        
        const successCount = await db.collection('blockchaintransactions').countDocuments({ status: true });
        const successRate = totalTransactions > 0 ? (successCount / totalTransactions) * 100 : 0;
        
        const recentTransactions = await db.collection('blockchaintransactions')
            .find({})
            .sort({ timestamp: -1 })
            .limit(10)
            .toArray();

        return {
            totalTransactions,
            totalBlocks,
            totalGasUsed: gasStats[0]?.totalGas || '0',
            successRate,
            recentTransactions
        };
    } catch (error: any) {
        console.error('[BlockchainStorage] Failed to get stats:', error?.message || error);
        return {
            totalTransactions: 0,
            totalBlocks: 0,
            totalGasUsed: '0',
            successRate: 0,
            recentTransactions: []
        };
    }
}
