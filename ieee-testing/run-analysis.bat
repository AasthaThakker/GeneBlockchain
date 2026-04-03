@echo off
echo 🚀 IEEE Transaction Latency Analysis Pipeline
echo =========================================
echo.

echo 📊 Step 1: Extracting latency data from MongoDB...
node extract-latency-data.js
if %errorlevel% neq 0 (
    echo ❌ Data extraction failed!
    pause
    exit /b 1
)

echo.
echo 📈 Step 2: Creating IEEE analysis graphs...
python create_latency_graph.py
if %errorlevel% neq 0 (
    echo ❌ Graph creation failed!
    pause
    exit /b 1
)

echo.
echo ✅ IEEE Analysis Complete!
echo 📁 Check the ieee-testing folder for:
echo    - latency_data.csv (raw data)
echo    - latency_analysis.png (graphs)
echo    - analysis_report.txt (IEEE report)
echo.

pause
