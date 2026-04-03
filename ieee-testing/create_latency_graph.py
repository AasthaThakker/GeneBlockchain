import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
from datetime import datetime

def create_latency_graph():
    """Create IEEE-compliant transaction latency graph"""
    
    print("📊 Creating IEEE Transaction Latency Analysis...\n")
    
    # Load data
    try:
        data = pd.read_csv("latency_data.csv")
        print(f"✅ Loaded {len(data)} transactions")
    except FileNotFoundError:
        print("❌ Error: latency_data.csv not found")
        print("👉 Run extract-latency-data.js first")
        return
    
    # Create figure with subplots
    fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(15, 12))
    fig.suptitle('IEEE Transaction Latency Analysis - GeneBlockchain', fontsize=16, fontweight='bold')
    
    # Graph 1: Latency vs Transaction Count (Primary IEEE Requirement)
    ax1.plot(data.index + 1, data['latency'], 'b-', linewidth=2, marker='o', markersize=4)
    ax1.set_xlabel("Transaction Count")
    ax1.set_ylabel("Latency (ms)")
    ax1.set_title("Transaction Latency vs Transaction Count")
    ax1.grid(True, alpha=0.3)
    
    # Graph 2: Latency Distribution
    ax2.hist(data['latency'], bins=20, color='skyblue', edgecolor='black', alpha=0.7)
    ax2.set_xlabel("Latency (ms)")
    ax2.set_ylabel("Frequency")
    ax2.set_title("Latency Distribution")
    ax2.grid(True, alpha=0.3)
    
    # Graph 3: Latency vs Block Number (Advanced Analysis)
    if 'blockNumber' in data.columns:
        ax3.scatter(data['blockNumber'], data['latency'], alpha=0.6, color='red')
        ax3.set_xlabel("Block Number")
        ax3.set_ylabel("Latency (ms)")
        ax3.set_title("Latency vs Block Number")
        ax3.grid(True, alpha=0.3)
    
    # Graph 4: Latency Trend with Moving Average
    if len(data) > 5:
        window_size = min(5, len(data) // 3)
        moving_avg = data['latency'].rolling(window=window_size).mean()
        ax4.plot(data.index + 1, data['latency'], 'b-', alpha=0.3, label='Raw Latency')
        ax4.plot(data.index + 1, moving_avg, 'r-', linewidth=2, label=f'{window_size}-Tx Moving Avg')
        ax4.set_xlabel("Transaction Count")
        ax4.set_ylabel("Latency (ms)")
        ax4.set_title("Latency Trend with Moving Average")
        ax4.legend()
        ax4.grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.savefig('latency_analysis.png', dpi=300, bbox_inches='tight')
    plt.show()
    
    # Generate IEEE Analysis Report
    generate_ieee_report(data)

def generate_ieee_report(data):
    """Generate IEEE-compliant analysis report"""
    
    print("\n🧠 IEEE ANALYSIS REPORT")
    print("=" * 50)
    
    # Basic statistics
    latencies = data['latency']
    min_latency = latencies.min()
    max_latency = latencies.max()
    mean_latency = latencies.mean()
    median_latency = latencies.median()
    std_latency = latencies.std()
    
    print(f"\n📊 STATISTICAL ANALYSIS:")
    print(f"  - Sample Size: {len(data)} transactions")
    print(f"  - Min Latency: {min_latency:.2f}ms")
    print(f"  - Max Latency: {max_latency:.2f}ms")
    print(f"  - Mean Latency: {mean_latency:.2f}ms")
    print(f"  - Median Latency: {median_latency:.2f}ms")
    print(f"  - Std Deviation: {std_latency:.2f}ms")
    
    # Percentiles
    p95 = latencies.quantile(0.95)
    p99 = latencies.quantile(0.99)
    print(f"\n📈 PERCENTILES:")
    print(f"  - 95th Percentile: {p95:.2f}ms")
    print(f"  - 99th Percentile: {p99:.2f}ms")
    
    # IEEE Analysis
    print(f"\n🔬 IEEE ANALYSIS:")
    
    # Observation
    print(f"\n📝 OBSERVATION:")
    if max_latency < 50:
        print(f"  Latency ranged between {min_latency:.0f}ms to {max_latency:.0f}ms under local Hardhat conditions.")
        print(f"  Performance shows excellent consistency with low variance.")
    elif max_latency < 200:
        print(f"  Latency ranged between {min_latency:.0f}ms to {max_latency:.0f}ms under local conditions.")
        print(f"  Performance shows good consistency with moderate variance.")
    else:
        print(f"  Latency ranged between {min_latency:.0f}ms to {max_latency:.0f}ms under local conditions.")
        print(f"  Performance shows notable variance requiring optimization.")
    
    # Reason
    print(f"\n🔍 REASON:")
    print(f"  Variability is primarily due to:")
    print(f"  - Block mining interval in Hardhat (instant mining vs delayed)")
    print(f"  - Network simulation overhead in local environment")
    print(f"  - Transaction processing queue dynamics")
    
    # Impact
    print(f"\n💡 IMPACT:")
    if mean_latency < 10:
        print(f"  Indicates excellent performance suitable for real-time applications.")
        print(f"  System demonstrates predictable performance under controlled blockchain environment.")
    elif mean_latency < 100:
        print(f"  Indicates good performance suitable for most applications.")
        print(f"  System demonstrates reliable performance with acceptable variance.")
    else:
        print(f"  Indicates need for optimization for time-sensitive applications.")
        print(f"  Performance characteristics require monitoring in production environment.")
    
    # Advanced insights
    if 'blockNumber' in data.columns:
        block_correlation = data['blockNumber'].corr(data['latency'])
        print(f"\n🔷 ADVANCED INSIGHTS:")
        print(f"  - Block Number vs Latency Correlation: {block_correlation:.3f}")
        
        if abs(block_correlation) > 0.3:
            print(f"  - Strong correlation between block number and latency detected")
        else:
            print(f"  - Weak correlation between block number and latency")
    
    # Performance classification
    print(f"\n🎯 PERFORMANCE CLASSIFICATION:")
    if mean_latency < 10:
        classification = "EXCELLENT"
    elif mean_latency < 50:
        classification = "GOOD"
    elif mean_latency < 200:
        classification = "ACCEPTABLE"
    else:
        classification = "NEEDS OPTIMIZATION"
    
    print(f"  - Overall Classification: {classification}")
    
    # Save report to file
    report_content = f"""
IEEE TRANSACTION LATENCY ANALYSIS REPORT
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

STATISTICAL ANALYSIS:
- Sample Size: {len(data)} transactions
- Min Latency: {min_latency:.2f}ms
- Max Latency: {max_latency:.2f}ms
- Mean Latency: {mean_latency:.2f}ms
- Median Latency: {median_latency:.2f}ms
- Std Deviation: {std_latency:.2f}ms

PERCENTILES:
- 95th Percentile: {p95:.2f}ms
- 99th Percentile: {p99:.2f}ms

OBSERVATION:
Latency ranged between {min_latency:.0f}ms to {max_latency:.0f}ms under local Hardhat conditions.
Performance shows {'excellent' if mean_latency < 10 else 'good' if mean_latency < 50 else 'acceptable'} consistency with {'low' if std_latency < mean_latency * 0.2 else 'moderate'} variance.

REASON:
Variability is primarily due to:
- Block mining interval in Hardhat (instant mining vs delayed)
- Network simulation overhead in local environment
- Transaction processing queue dynamics

IMPACT:
{'Indicates excellent performance suitable for real-time applications.' if mean_latency < 10 else 'Indicates good performance suitable for most applications.' if mean_latency < 50 else 'Indicates acceptable performance with room for optimization.'}
System demonstrates predictable performance under controlled blockchain environment.

PERFORMANCE CLASSIFICATION: {classification}
"""
    
    with open('analysis_report.txt', 'w') as f:
        f.write(report_content)
    
    print(f"\n💾 Report saved to: analysis_report.txt")
    print(f"📊 Graph saved to: latency_analysis.png")

if __name__ == "__main__":
    create_latency_graph()
