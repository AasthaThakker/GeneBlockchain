# IEEE Transaction Latency Testing

This folder contains comprehensive tools for IEEE-compliant transaction latency analysis of the GeneBlockchain platform.

## 📁 Files Overview

### Data Extraction
- **`extract-latency-data.js`** - Extracts latency data from MongoDB and exports to CSV
- **`latency_data.csv`** - Raw transaction latency data (generated)

### Analysis & Graphing
- **`create_latency_graph.py`** - Creates IEEE-compliant graphs and analysis report
- **`latency_analysis.png`** - Multi-panel analysis graphs (generated)
- **`analysis_report.txt`** - IEEE-formatted analysis report (generated)

### Execution Scripts
- **`run-analysis.bat`** - Windows batch script for complete analysis pipeline
- **`run-analysis.sh`** - Linux/Mac shell script for complete analysis pipeline

## 🚀 Quick Start

### Windows
```bash
cd ieee-testing
run-analysis.bat
```

### Linux/Mac
```bash
cd ieee-testing
chmod +x run-analysis.sh
./run-analysis.sh
```

### Manual Execution
```bash
# Step 1: Extract data
node extract-latency-data.js

# Step 2: Create graphs and analysis
python create_latency_graph.py
```

## 📊 IEEE Analysis Components

### 1. Primary Graph (Requirement)
- **Type**: Line Graph
- **X-axis**: Transaction Count
- **Y-axis**: Latency (ms)
- **Purpose**: Shows latency progression across transactions

### 2. Supporting Analysis
- **Latency Distribution**: Histogram showing frequency distribution
- **Latency vs Block Number**: Correlation analysis
- **Moving Average Trend**: Performance trend analysis

### 3. IEEE Report Format
- **Observation**: Statistical findings
- **Reason**: Technical explanation of variability
- **Impact**: Performance implications
- **Classification**: Overall performance rating

## 📈 Data Schema Utilization

The analysis leverages the enhanced schema fields:
- `latency` - Primary measurement (ms)
- `blockNumber` - Correlation analysis
- `timestamp` - Temporal trends
- `confirmations` - Network reliability metrics

## 🔧 Requirements

### Dependencies
- Node.js (for MongoDB data extraction)
- Python 3.x (for graphing and analysis)
- Python packages: pandas, matplotlib, numpy

### Database
- MongoDB running on localhost:27017
- GeneBlockchain database with transaction data

## 📋 Output Files

After running the analysis, you'll get:

1. **latency_data.csv** - Raw data for external analysis
2. **latency_analysis.png** - IEEE-compliant graphs
3. **analysis_report.txt** - Formatted IEEE analysis

## 🎯 Performance Classifications

- **EXCELLENT**: < 10ms average latency
- **GOOD**: 10-50ms average latency  
- **ACCEPTABLE**: 50-200ms average latency
- **NEEDS OPTIMIZATION**: > 200ms average latency

## 📊 Advanced Insights

The analysis provides:
- Statistical percentiles (95th, 99th)
- Correlation analysis (block number vs latency)
- Performance trend analysis
- Variance assessment
- Production readiness evaluation
