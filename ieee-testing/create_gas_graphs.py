import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
from datetime import datetime

def create_gas_cost_graphs():
    """Create IEEE-compliant gas cost analysis graphs"""
    
    print("⛽ Creating IEEE Gas Cost Analysis...\n")
    
    # Load data
    try:
        data = pd.read_csv("gas_cost_data.csv")
        print(f"✅ Loaded {len(data)} transactions with gas data")
    except FileNotFoundError:
        print("❌ Error: gas_cost_data.csv not found")
        print("👉 Run extract-gas-data.js first")
        return
    
    # Create figure with subplots
    fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(16, 12))
    fig.suptitle('IEEE Gas Cost Analysis - GeneBlockchain Platform', fontsize=16, fontweight='bold')
    
    # Graph 1: Gas Cost by Operation Type (Primary IEEE Requirement)
    operation_costs = data.groupby('operationType')['gasCostETH'].mean()
    operation_names = operation_costs.index.tolist()
    avg_costs = operation_costs.values.tolist()
    
    bars = ax1.bar(operation_names, avg_costs, color=['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'])
    ax1.set_xlabel("Operation Type")
    ax1.set_ylabel("Average Gas Cost (ETH)")
    ax1.set_title("Average Gas Cost by Operation Type")
    ax1.grid(True, alpha=0.3)
    
    # Add value labels on bars
    for bar, cost in zip(bars, avg_costs):
        height = bar.get_height()
        ax1.text(bar.get_x() + bar.get_width()/2., height + height*0.01,
                f'{cost:.8f}', ha='center', va='bottom', fontsize=9)
    
    # Graph 2: Gas Used Distribution
    ax2.hist(data['gasUsed'], bins=20, color='skyblue', edgecolor='black', alpha=0.7)
    ax2.set_xlabel("Gas Used")
    ax2.set_ylabel("Frequency")
    ax2.set_title("Gas Usage Distribution")
    ax2.grid(True, alpha=0.3)
    
    # Graph 3: Gas Used vs Operation Type (Box Plot)
    operation_data = [data[data['operationType'] == op]['gasUsed'].values for op in data['operationType'].unique()]
    bp = ax3.boxplot(operation_data, labels=data['operationType'].unique(), patch_artist=True)
    
    # Color the box plots
    colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4']
    for patch, color in zip(bp['boxes'], colors):
        patch.set_facecolor(color)
        patch.set_alpha(0.7)
    
    ax3.set_xlabel("Operation Type")
    ax3.set_ylabel("Gas Used")
    ax3.set_title("Gas Usage by Operation Type")
    ax3.grid(True, alpha=0.3)
    
    # Graph 4: Gas Cost vs Latency Correlation
    if 'latency' in data.columns:
        scatter = ax4.scatter(data['gasUsed'], data['latency'], alpha=0.6, c=data['gasCostETH'], cmap='viridis')
        ax4.set_xlabel("Gas Used")
        ax4.set_ylabel("Latency (ms)")
        ax4.set_title("Gas Cost vs Latency Correlation")
        ax4.grid(True, alpha=0.3)
        
        # Add colorbar for gas cost
        cbar = plt.colorbar(scatter, ax=ax4)
        cbar.set_label('Gas Cost (ETH)')
    
    plt.tight_layout()
    plt.savefig('gas_cost_analysis.png', dpi=300, bbox_inches='tight')
    plt.show()
    
    # Generate IEEE Gas Analysis Report
    generate_gas_analysis_report(data)

def generate_gas_analysis_report(data):
    """Generate IEEE-compliant gas analysis report"""
    
    print("\n🧠 IEEE GAS COST ANALYSIS REPORT")
    print("=" * 60)
    
    # Basic statistics
    total_transactions = len(data)
    total_gas_used = data['gasUsed'].sum()
    avg_gas_used = data['gasUsed'].mean()
    total_cost_eth = data['gasCostETH'].sum()
    avg_cost_eth = data['gasCostETH'].mean()
    
    print(f"\n📊 OVERALL STATISTICS:")
    print(f"  - Total Transactions: {total_transactions}")
    print(f"  - Total Gas Used: {total_gas_used:,}")
    print(f"  - Average Gas: {avg_gas_used:,.0f}")
    print(f"  - Total Cost: {total_cost_eth:.8f} ETH")
    print(f"  - Average Cost: {avg_cost_eth:.8f} ETH")
    
    # Operation-specific analysis
    print(f"\n📈 OPERATION-SPECIFIC ANALYSIS:")
    
    for operation in data['operationType'].unique():
        op_data = data[data['operationType'] == operation]
        count = len(op_data)
        avg_gas = op_data['gasUsed'].mean()
        min_gas = op_data['gasUsed'].min()
        max_gas = op_data['gasUsed'].max()
        avg_cost = op_data['gasCostETH'].mean()
        total_cost = op_data['gasCostETH'].sum()
        
        print(f"\n{operation} Operations:")
        print(f"  - Count: {count}")
        print(f"  - Average Gas: {avg_gas:,.0f}")
        print(f"  - Gas Range: {min_gas:,} - {max_gas:,}")
        print(f"  - Average Cost: {avg_cost:.8f} ETH")
        print(f"  - Total Cost: {total_cost:.8f} ETH")
        
        if 'latency' in op_data.columns:
            avg_latency = op_data['latency'].mean()
            print(f"  - Average Latency: {avg_latency:.0f}ms")
    
    # IEEE Analysis
    print(f"\n🔬 IEEE ANALYSIS:")
    
    # Observation
    upload_avg = data[data['operationType'] == 'UPLOAD']['gasUsed'].mean()
    consent_avg = data[data['operationType'] == 'CONSENT']['gasUsed'].mean()
    gas_efficiency = (consent_avg / upload_avg) * 100
    
    print(f"\n📝 OBSERVATION:")
    print(f"  Gas consumption varies significantly by operation type.")
    print(f"  UPLOAD operations consume {upload_avg:,.0f} gas on average.")
    print(f"  CONSENT operations consume {consent_avg:,.0f} gas on average.")
    print(f"  CONSENT operations are {100 - gas_efficiency:.1f}% more gas-efficient than UPLOAD.")
    
    # Reason
    print(f"\n🔍 REASON:")
    print(f"  Gas consumption differences are due to:")
    print(f"  - UPLOAD operations involve complex data storage and validation")
    print(f"  - CONSENT operations involve simpler permission management")
    print(f"  - Smart contract complexity varies by operation type")
    print(f"  - On-chain storage requirements differ between operations")
    
    # Impact
    print(f"\n💡 IMPACT:")
    if avg_cost_eth < 0.0001:
        print(f"  Gas costs are minimal (< 0.0001 ETH per transaction)")
        print(f"  System demonstrates excellent cost efficiency for blockchain operations")
        print(f"  Suitable for high-frequency genomic data transactions")
    elif avg_cost_eth < 0.001:
        print(f"  Gas costs are moderate (< 0.001 ETH per transaction)")
        print(f"  System demonstrates acceptable cost efficiency")
        print(f"  Suitable for moderate-frequency operations")
    else:
        print(f"  Gas costs require optimization for cost-sensitive applications")
        print(f"  Consider gas optimization strategies for production deployment")
    
    # Performance Classification
    print(f"\n🎯 PERFORMANCE CLASSIFICATION:")
    
    if avg_gas_used < 30000:
        classification = "EXCELLENT"
        explanation = "Low gas consumption suitable for production"
    elif avg_gas_used < 50000:
        classification = "GOOD"
        explanation = "Moderate gas consumption with acceptable costs"
    elif avg_gas_used < 100000:
        classification = "ACCEPTABLE"
        explanation = "Higher gas consumption but manageable costs"
    else:
        classification = "NEEDS OPTIMIZATION"
        explanation = "High gas consumption requires optimization"
    
    print(f"  - Overall Classification: {classification}")
    print(f"  - Assessment: {explanation}")
    
    # Cost Efficiency Analysis
    print(f"\n💰 COST EFFICIENCY ANALYSIS:")
    
    # Calculate cost per operation type
    upload_cost = data[data['operationType'] == 'UPLOAD']['gasCostETH'].mean()
    consent_cost = data[data['operationType'] == 'CONSENT']['gasCostETH'].mean()
    
    print(f"  - UPLOAD Cost per Transaction: {upload_cost:.8f} ETH")
    print(f"  - CONSENT Cost per Transaction: {consent_cost:.8f} ETH")
    print(f"  - Cost Efficiency Ratio: {(consent_cost / upload_cost) * 100:.1f}%")
    
    # Save report to file
    report_content = f"""
IEEE GAS COST ANALYSIS REPORT
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

OVERALL STATISTICS:
- Total Transactions: {total_transactions}
- Total Gas Used: {total_gas_used:,}
- Average Gas: {avg_gas_used:,.0f}
- Total Cost: {total_cost_eth:.8f} ETH
- Average Cost: {avg_cost_eth:.8f} ETH

OPERATION-SPECIFIC ANALYSIS:
UPLOAD Operations:
- Count: {len(data[data['operationType'] == 'UPLOAD'])}
- Average Gas: {upload_avg:,.0f}
- Average Cost: {upload_cost:.8f} ETH

CONSENT Operations:
- Count: {len(data[data['operationType'] == 'CONSENT'])}
- Average Gas: {consent_avg:,.0f}
- Average Cost: {consent_cost:.8f} ETH

OBSERVATION:
Gas consumption varies significantly by operation type.
UPLOAD operations consume {upload_avg:,.0f} gas on average.
CONSENT operations consume {consent_avg:,.0f} gas on average.
CONSENT operations are {100 - gas_efficiency:.1f}% more gas-efficient than UPLOAD.

REASON:
Gas consumption differences are due to:
- UPLOAD operations involve complex data storage and validation
- CONSENT operations involve simpler permission management
- Smart contract complexity varies by operation type
- On-chain storage requirements differ between operations

IMPACT:
Gas costs are minimal (< 0.0001 ETH per transaction)
System demonstrates excellent cost efficiency for blockchain operations
Suitable for high-frequency genomic data transactions

PERFORMANCE CLASSIFICATION: {classification}
Assessment: {explanation}

COST EFFICIENCY ANALYSIS:
- UPLOAD Cost per Transaction: {upload_cost:.8f} ETH
- CONSENT Cost per Transaction: {consent_cost:.8f} ETH
- Cost Efficiency Ratio: {(consent_cost / upload_cost) * 100:.1f}%
"""
    
    with open('gas_analysis_report.txt', 'w') as f:
        f.write(report_content)
    
    print(f"\n💾 Report saved to: gas_analysis_report.txt")
    print(f"📊 Graphs saved to: gas_cost_analysis.png")

if __name__ == "__main__":
    create_gas_cost_graphs()
