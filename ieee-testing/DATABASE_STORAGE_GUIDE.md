# 📍 Database Storage Location & Persistence

## 🗄️ **WHERE RAW DATA IS STORED**

### **MongoDB Location**
```
📍 Host: localhost:27017
📁 Database: genomic-data-platform
📋 Collection: blockchaintransactions
```

### **Data Structure**
Each transaction is stored as a document in the `blockchaintransactions` collection with these key fields:

```javascript
{
  txHash: "0x...",
  blockNumber: 1,
  timestamp: Date,
  
  // 🟢 IEEE Latency Fields
  submissionTime: Date,      // When transaction was submitted
  confirmationTime: Date,    // When transaction was confirmed
  latency: 20,              // Time in milliseconds
  
  functionName: "registerGenomicData",
  functionParameters: { pid: "...", fileHash: "...", ipfsCID: "..." },
  
  // ... other blockchain fields
}
```

## 💾 **PERSISTENCE ANSWER**

### **❌ YOU DO NOT NEED TO RUN EVERYTIME**

**The data is PERMANENTLY stored in MongoDB:**

✅ **Persistent Storage**: Data survives server restarts  
✅ **No Regeneration Needed**: IEEE test data (120 transactions) remains  
✅ **Automatic Loading**: Analysis scripts read existing data  
✅ **Incremental**: New transactions add to existing data  

### **What Happens When You Restart:**

1. **MongoDB Starts**: All existing data is automatically available
2. **Application Starts**: Connects to existing database
3. **IEEE Analysis**: Reads existing 122 transactions with latency data
4. **New Transactions**: Add to existing dataset (if you execute more)

## 🔧 **HOW TO ACCESS YOUR DATA**

### **1. GUI Method (Recommended)**
```bash
# Open MongoDB Compass
# Connect to: mongodb://localhost:27017
# Navigate: genomic-data-platform → blockchaintransactions
```

### **2. Command Line Method**
```bash
# Connect to MongoDB
mongo mongodb://localhost:27017/genomic-data-platform

# View all transactions
db.blockchaintransactions.find().pretty()

# View only IEEE test data
db.blockchaintransactions.find({
  'functionParameters.pid': { $regex: '^IEEE-TEST-' }
}).pretty()

# View latency statistics
db.blockchaintransactions.aggregate([
  { $match: { latency: { $exists: true } } },
  { $group: {
    _id: null,
    count: { $sum: 1 },
    avgLatency: { $avg: '$latency' },
    minLatency: { $min: '$latency' },
    maxLatency: { $max: '$latency' }
  }}
])
```

### **3. Application Method**
```bash
# Export to CSV (anytime)
cd ieee-testing
node extract-latency-data.js

# Generate graphs (anytime)
python create_latency_graph.py
```

## 📊 **CURRENT DATA STATUS**

### **Your Dataset:**
- **Total Transactions**: 125 in database
- **With Latency Data**: 122 transactions
- **IEEE Test Data**: 120 transactions
- **Data Range**: 7ms - 59ms latency
- **Storage Size**: ~50KB of transaction data

### **Data Persistence:**
```
✅ Survives MongoDB restarts
✅ Survives application restarts  
✅ Survives computer restarts (if MongoDB running)
✅ Available for immediate analysis
```

## 🚀 **WORKFLOW SIMPLIFIED**

### **Normal Usage (No New Data Needed):**
```bash
# Start MongoDB
# Start application
# Run IEEE analysis immediately
cd ieee-testing
python create_latency_graph.py
```

### **When You Want New Data:**
```bash
# Execute more transactions
node execute-with-storage.js

# Then analyze
node extract-latency-data.js
python create_latency_graph.py
```

## 📋 **BACKUP & RECOVERY**

### **Backup Your Data:**
```bash
# Backup entire database
mongodump --db genomic-data-platform --out ./backup

# Backup only transactions
mongoexport --db genomic-data-platform --collection blockchaintransactions --out ./transactions.json
```

### **Restore Data:**
```bash
# Restore entire database
mongorestore --db genomic-data-platform ./backup/genomic-data-platform

# Restore only transactions
mongoimport --db genomic-data-platform --collection blockchaintransactions ./transactions.json
```

## 🎯 **SUMMARY**

**Your IEEE latency data is permanently stored and ready to use:**

- 📍 **Location**: `mongodb://localhost:27017/genomic-data-platform.blockchaintransactions`
- 💾 **Persistence**: Automatic - no regeneration needed
- 🔧 **Access**: MongoDB Compass, command line, or application scripts
- 📊 **Current**: 122 transactions with complete latency data
- 🚀 **Usage**: Run analysis anytime, data persists across restarts
