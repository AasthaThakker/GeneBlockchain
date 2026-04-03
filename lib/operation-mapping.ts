// IEEE Gas Analysis - Operation Type Mapping
// Maps blockchain function names to standardized operation types for IEEE analysis

export const OPERATION_TYPE_MAPPING = {
    // Upload operations
    'registerGenomicData': 'UPLOAD',
    'uploadHash': 'UPLOAD',
    'storeData': 'UPLOAD',
    
    // Access operations  
    'requestAccess': 'ACCESS_REQUEST',
    'logAccess': 'ACCESS_REQUEST',
    'grantAccess': 'ACCESS_REQUEST',
    
    // Consent operations
    'grantConsent': 'CONSENT',
    'revokeConsent': 'CONSENT',
    'updateConsent': 'CONSENT',
    
    // Verification operations
    'verifyIntegrity': 'VERIFY',
    'verifyData': 'VERIFY',
    'authenticate': 'VERIFY',
    
    // Other operations (fallback)
    'registerRole': 'OTHER',
    'proposeRegistration': 'OTHER',
    'voteOnRegistration': 'OTHER',
    'finalizeRegistration': 'OTHER'
} as const;

/**
 * Get standardized operation type from function name
 * @param functionName - The blockchain function name
 * @returns Standardized operation type for IEEE analysis
 */
export function getOperationType(functionName: string): "UPLOAD" | "ACCESS_REQUEST" | "CONSENT" | "VERIFY" | "OTHER" {
    return OPERATION_TYPE_MAPPING[functionName as keyof typeof OPERATION_TYPE_MAPPING] || 'OTHER';
}

/**
 * Calculate gas cost in ETH from receipt
 * @param receipt - Transaction receipt
 * @returns Gas cost in ETH as string
 */
export function calculateGasCostETH(receipt: any): string {
    try {
        const gasUsed = receipt.gasUsed;
        const effectiveGasPrice = receipt.effectiveGasPrice || receipt.gasPrice;
        const gasCost = gasUsed * effectiveGasPrice;
        
        // Convert from wei to ETH (assuming gasUsed and gasPrice are in wei)
        const gasCostETH = Number(gasCost) / Math.pow(10, 18);
        return gasCostETH.toString();
    } catch (error) {
        console.warn('Error calculating gas cost:', error);
        return '0';
    }
}
