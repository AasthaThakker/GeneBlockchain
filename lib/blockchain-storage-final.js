const mongoose = require('mongoose');

/**
 * Store comprehensive blockchain transaction details in MongoDB
 * Error-free JavaScript version
 */
async function storeTransaction(txData) {
    try {
        // Ensure connection
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect('mongodb://localhost:27017/genomic-data-platform');
        }
        
        const db = mongoose.connection.db;
        const result = await db.collection('blockchaintransactions').insertOne({
            ...txData,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        
        console.log(`[BlockchainStorage] Stored transaction ${txData.txHash}`);
        return result.insertedId;
    } catch (error) {
        console.error('[BlockchainStorage] Failed to store transaction:', error.message || error);
        throw error;
    }
}

/**
 * Store block information in MongoDB
 */
async function storeBlock(blockData) {
    try {
        // Ensure connection
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect('mongodb://localhost:27017/genomic-data-platform');
        }
        
        const db = mongoose.connection.db;
        const result = await db.collection('blocks').insertOne({
            ...blockData,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        
        console.log(`[BlockchainStorage] Stored block ${blockData.blockNumber}`);
        return result.insertedId;
    } catch (error) {
        console.error(`[BlockchainStorage] Failed to store block ${blockData.blockNumber}:`, error.message || error);
        throw error;
    }
}

/**
 * Get transaction with full details
 */
async function getTransactionDetails(txHash) {
    try {
        // Ensure connection
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect('mongodb://localhost:27017/genomic-data-platform');
        }
        
        const db = mongoose.connection.db;
        return await db.collection('blockchaintransactions').findOne({ txHash });
    } catch (error) {
        console.error(`[BlockchainStorage] Failed to get transaction ${txHash}:`, error.message || error);
        return null;
    }
}

/**
 * Get block with full details
 */
async function getBlockDetails(blockNumber) {
    try {
        // Ensure connection
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect('mongodb://localhost:27017/genomic-data-platform');
        }
        
        const db = mongoose.connection.db;
        return await db.collection('blocks').findOne({ blockNumber });
    } catch (error) {
        console.error(`[BlockchainStorage] Failed to get block ${blockNumber}:`, error.message || error);
        return null;
    }
}

/**
 * Get transactions by address
 */
async function getTransactionsByAddress(address, limit = 50, offset = 0) {
    try {
        // Ensure connection
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect('mongodb://localhost:27017/genomic-data-platform');
        }
        
        const db = mongoose.connection.db;
        return await db.collection('blockchaintransactions')
            .find({
                $or: [{ from: address }, { to: address }]
            })
            .sort({ timestamp: -1 })
            .limit(limit)
            .skip(offset)
            .toArray();
    } catch (error) {
        console.error(`[BlockchainStorage] Failed to get transactions for ${address}:`, error.message || error);
        return [];
    }
}

/**
 * Get transactions by function name
 */
async function getTransactionsByFunction(functionName, limit = 50, offset = 0) {
    try {
        // Ensure connection
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect('mongodb://localhost:27017/genomic-data-platform');
        }
        
        const db = mongoose.connection.db;
        return await db.collection('blockchaintransactions')
            .find({ functionName })
            .sort({ timestamp: -1 })
            .limit(limit)
            .skip(offset)
            .toArray();
    } catch (error) {
        console.error(`[BlockchainStorage] Failed to get transactions for function ${functionName}:`, error.message || error);
        return [];
    }
}

/**
 * Get blockchain statistics
 */
async function getBlockchainStats() {
    try {
        // Ensure connection
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect('mongodb://localhost:27017/genomic-data-platform');
        }
        
        const db = mongoose.connection.db;
        
        const totalTransactions = await db.collection('blockchaintransactions').countDocuments();
        const totalBlocks = await db.collection('blocks').countDocuments();
        
        const gasStats = await db.collection('blockchaintransactions').aggregate([
            { $group: { _id: null, totalGas: { $sum: "$gasUsed" } } }
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
    } catch (error) {
        console.error('[BlockchainStorage] Failed to get stats:', error.message || error);
        return {
            totalTransactions: 0,
            totalBlocks: 0,
            totalGasUsed: '0',
            successRate: 0,
            recentTransactions: []
        };
    }
}

module.exports = {
    storeTransaction,
    storeBlock,
    getTransactionDetails,
    getBlockDetails,
    getTransactionsByAddress,
    getTransactionsByFunction,
    getBlockchainStats
};
