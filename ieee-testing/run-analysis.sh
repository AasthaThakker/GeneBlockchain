#!/bin/bash

echo "🚀 IEEE Transaction Latency Analysis Pipeline"
echo "========================================="
echo

echo "📊 Step 1: Extracting latency data from MongoDB..."
node extract-latency-data.js
if [ $? -ne 0 ]; then
    echo "❌ Data extraction failed!"
    exit 1
fi

echo
echo "📈 Step 2: Creating IEEE analysis graphs..."
python3 create_latency_graph.py
if [ $? -ne 0 ]; then
    echo "❌ Graph creation failed!"
    exit 1
fi

echo
echo "✅ IEEE Analysis Complete!"
echo "📁 Check the ieee-testing folder for:"
echo "   - latency_data.csv (raw data)"
echo "   - latency_analysis.png (graphs)"
echo "   - analysis_report.txt (IEEE report)"
echo
