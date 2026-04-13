import { ethers } from 'ethers';
import { storeTransaction, storeBlock, ITransactionData } from './blockchain-storage';
import { getOperationType, calculateGasCostETH } from './operation-mapping';
import { CONTRACT_ABI } from './contract-abi';
import { createProvider, createContract, createContractWithSigner, DEFAULT_HARDHAT_KEY } from './blockchain-utils';

function getContract() {
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    if (!contractAddress) {
        throw new Error("NEXT_PUBLIC_CONTRACT_ADDRESS not set in .env");
    }
    return createContractWithSigner(contractAddress);
}

// ===== Genomic Hash Registry =====

/**
 * Register genomic data hash on-chain
 * @returns Transaction hash and record index
 */
export async function registerGenomicData(
    pid: string,
    fileHash: string,
    fileId: string
): Promise<{ txHash: string; recordIndex: number; latency?: number }> {
    const contract = getContract();
    
    // Track submission time
    const submissionTime = Date.now();
    
    const tx = await contract.registerGenomicData(pid, fileHash, fileId);
    const receipt = await tx.wait();
    
    // Track confirmation time and calculate latency
    const confirmationTime = Date.now();
    const latency = confirmationTime - submissionTime;

    let recordIndex = -1;

    for (const log of receipt.logs) {
        try {
            const parsedLog = contract.interface.parseLog({
                topics: [...log.topics],
                data: log.data
            });

            if (parsedLog?.name === "GenomicDataRegistered") {
                recordIndex = Number(parsedLog.args.recordIndex);
                break;
            }
        } catch (e) {
            continue;
        }
    }

    if (recordIndex === -1) {
        console.warn(`[Blockchain] Transaction ${receipt.hash} successful but GenomicDataRegistered event not found in logs. Using count fallback.`);
        try {
            const count = await contract.recordCount();
            recordIndex = Number(count) - 1;
            console.log(`[Blockchain] Fallback recordIndex: ${recordIndex}`);
        } catch (e) {
            console.error(`[Blockchain] Fallback failed:`, e);
            // Use transaction receipt transactionIndex as final fallback
            recordIndex = receipt.index || 0;
            console.log(`[Blockchain] Using transaction index as recordIndex: ${recordIndex}`);
        }
    }

    // Store comprehensive transaction details
    try {
        const functionName = 'registerGenomicData';
        const operationType = getOperationType(functionName);
        const gasCostETH = calculateGasCostETH(receipt);
        
        const transactionData: ITransactionData = {
            txHash: receipt.hash,
            blockNumber: receipt.blockNumber,
            blockHash: receipt.blockHash,
            transactionIndex: receipt.index,
            gasUsed: receipt.gasUsed.toString(),
            gasPrice: tx.gasPrice?.toString() || '0',
            gasLimit: tx.gasLimit.toString(),
            effectiveGasPrice: tx.gasPrice?.toString() || '0',
            maxFeePerGas: tx.maxFeePerGas?.toString(),
            maxPriorityFeePerGas: tx.maxPriorityFeePerGas?.toString(),
            from: tx.from,
            to: tx.to || '',
            value: tx.value.toString(),
            data: tx.data,
            nonce: tx.nonce,
            status: receipt.status === 1,
            timestamp: new Date(),
            confirmations: receipt.confirmations,
            
            // Transaction Latency Metrics
            submissionTime: new Date(submissionTime),
            confirmationTime: new Date(confirmationTime),
            latency: latency,
            
            contractAddress: tx.to,
            functionName: functionName,
            operationType: operationType,
            gasCostETH: gasCostETH,
            functionParameters: { pid, fileHash, fileId },
            events: receipt.logs.map((log: any, index: number) => ({
                name: `Event${index}`,
                signature: log.topics[0] || '',
                args: {
                    topics: log.topics,
                    data: log.data
                },
                address: log.address,
                logIndex: log.index
            })),
            relatedEntity: { type: 'GenomicData', id: recordIndex.toString() },
            networkId: 'localhost'
        };
        
        await storeTransaction(transactionData);

        // Store block if not already stored
        if (receipt.blockNumber) {
            try {
                const blockData = await createProvider().getBlock(receipt.blockNumber);
                if (blockData) {
                    await storeBlock({
                        blockNumber: blockData.number,
                        blockHash: blockData.hash || '',
                        parentHash: blockData.parentHash || '',
                        timestamp: new Date(blockData.timestamp * 1000),
                        miner: blockData.miner || '',
                        difficulty: blockData.difficulty.toString(),
                        totalDifficulty: blockData.difficulty.toString(),
                        size: 0,
                        gasLimit: blockData.gasLimit.toString(),
                        gasUsed: blockData.gasUsed.toString(),
                        transactionCount: blockData.transactions.length,
                        transactionHashes: blockData.transactions.map((tx: any) => typeof tx === 'string' ? tx : tx.hash),
                        networkId: 'localhost'
                    });
                }
            } catch (blockError: any) {
                console.warn(`[Blockchain] Block already stored or failed:`, blockError?.message || blockError);
            }
        }
    } catch (storageError) {
        console.error('[Blockchain] Failed to store transaction details:', storageError);
        // Continue execution even if storage fails
    }

    return { txHash: receipt.hash, recordIndex, latency };
}

/**
 * Verify integrity of a genomic record against on-chain hash
 */
export async function verifyIntegrity(
    recordIndex: number,
    fileHash: string
): Promise<boolean> {
    const contract = getContract();
    return await contract.verifyIntegrity(recordIndex, fileHash);
}

// ===== Dynamic Consent =====

/**
 * Grant time-bound consent on-chain
 * @returns Transaction hash and consent index
 */
export async function grantConsent(
    pid: string,
    researcherAddress: string,
    recordIndex: number,
    durationDays: number
): Promise<{ txHash: string; consentIndex: number; latency?: number }> {
    const contract = getContract();
    
    // Track submission time
    const submissionTime = Date.now();
    
    const tx = await contract.grantConsent(pid, researcherAddress, recordIndex, durationDays);
    const receipt = await tx.wait();
    
    // Track confirmation time and calculate latency
    const confirmationTime = Date.now();
    const latency = confirmationTime - submissionTime;

    const event = receipt.logs
        .map((log: ethers.Log) => {
            try {
                return contract.interface.parseLog({ topics: [...log.topics], data: log.data });
            } catch {
                return null;
            }
        })
        .find((e: ethers.LogDescription | null) => e?.name === "ConsentGranted");

    let consentIndex = event ? Number(event.args.consentIndex) : -1;

    if (consentIndex === -1) {
        console.warn(`[Blockchain] Transaction ${receipt.hash} successful but ConsentGranted event not found. Using count fallback.`);
        try {
            const count = await contract.consentCount();
            consentIndex = Number(count) - 1;
            console.log(`[Blockchain] Fallback consentIndex: ${consentIndex}`);
        } catch (e) {
            console.error(`[Blockchain] Fallback failed:`, e);
        }
    }

    // Store comprehensive transaction details
    try {
        const functionName = 'grantConsent';
        const operationType = getOperationType(functionName);
        const gasCostETH = calculateGasCostETH(receipt);
        
        const transactionData: ITransactionData = {
            txHash: receipt.hash,
            blockNumber: receipt.blockNumber,
            blockHash: receipt.blockHash,
            transactionIndex: receipt.index,
            gasUsed: receipt.gasUsed.toString(),
            gasPrice: tx.gasPrice?.toString() || '0',
            gasLimit: tx.gasLimit.toString(),
            effectiveGasPrice: tx.gasPrice?.toString() || '0',
            maxFeePerGas: tx.maxFeePerGas?.toString(),
            maxPriorityFeePerGas: tx.maxPriorityFeePerGas?.toString(),
            from: tx.from,
            to: tx.to || '',
            value: tx.value.toString(),
            data: tx.data,
            nonce: tx.nonce,
            status: receipt.status === 1,
            timestamp: new Date(),
            confirmations: receipt.confirmations,
            
            // Transaction Latency Metrics
            submissionTime: new Date(submissionTime),
            confirmationTime: new Date(confirmationTime),
            latency: latency,
            
            contractAddress: tx.to,
            functionName: functionName,
            operationType: operationType,
            gasCostETH: gasCostETH,
            functionParameters: { pid, researcherAddress, recordIndex, durationDays },
            events: receipt.logs.map((log: any, index: number) => ({
                name: `Event${index}`,
                signature: log.topics[0] || '',
                args: {
                    topics: log.topics,
                    data: log.data
                },
                address: log.address,
                logIndex: log.index
            })),
            relatedEntity: { type: 'Consent', id: consentIndex.toString() },
            networkId: 'localhost'
        };
        
        await storeTransaction(transactionData);

        // Store block if not already stored
        if (receipt.blockNumber) {
            try {
                const blockData = await createProvider().getBlock(receipt.blockNumber);
                if (blockData) {
                    await storeBlock({
                        blockNumber: blockData.number,
                        blockHash: blockData.hash || '',
                        parentHash: blockData.parentHash || '',
                        timestamp: new Date(blockData.timestamp * 1000),
                        miner: blockData.miner || '',
                        difficulty: blockData.difficulty.toString(),
                        totalDifficulty: blockData.difficulty.toString(),
                        size: 0,
                        gasLimit: blockData.gasLimit.toString(),
                        gasUsed: blockData.gasUsed.toString(),
                        transactionCount: blockData.transactions.length,
                        transactionHashes: blockData.transactions.map((tx: any) => typeof tx === 'string' ? tx : tx.hash),
                        networkId: 'localhost'
                    });
                }
            } catch (blockError: any) {
                console.warn(`[Blockchain] Block already stored or failed:`, blockError?.message || blockError);
            }
        }
    } catch (storageError) {
        console.error('[Blockchain] Failed to store transaction details:', storageError);
    }

    return { txHash: receipt.hash, consentIndex, latency };
}

/**
 * Revoke consent on-chain
 * @returns Transaction hash
 */
export async function revokeConsentOnChain(
    consentIndex: number
): Promise<{ txHash: string }> {
    const contract = getContract();
    const tx = await contract.revokeConsent(consentIndex);
    const receipt = await tx.wait();
    return { txHash: receipt.hash };
}

/**
 * Check if consent is active on-chain
 */
export async function checkConsentActive(consentIndex: number): Promise<boolean> {
    const contract = getContract();
    return await contract.isConsentActive(consentIndex);
}

// ===== Access Logging =====

/**
 * Log data access event on-chain (validates consent)
 * @returns Transaction hash and whether access was granted
 */
export async function logAccessOnChain(
    pid: string,
    researcherAddress: string,
    recordIndex: number,
    consentIndex: number
): Promise<{ txHash: string; accessGranted: boolean }> {
    const contract = getContract();
    const tx = await contract.logAccess(pid, researcherAddress, recordIndex, consentIndex);
    const receipt = await tx.wait();

    // Check if DataAccessed or AccessDenied was emitted
    const accessEvent = receipt.logs
        .map((log: ethers.Log) => {
            try {
                return contract.interface.parseLog({ topics: [...log.topics], data: log.data });
            } catch {
                return null;
            }
        })
        .find((e: ethers.LogDescription | null) => e?.name === "DataAccessed" || e?.name === "AccessDenied");

    const accessGranted = accessEvent?.name === "DataAccessed";

    return { txHash: receipt.hash, accessGranted };
}

// ===== Registration Voting =====

/**
 * Propose a new registration on-chain
 * @param applicantAddress Wallet address of applicant
 * @param role 2 = Lab, 3 = Researcher (matching the Solidity enum)
 * @param votingDays Duration of voting window
 * @returns Transaction hash and proposal ID
 */
export async function proposeRegistrationOnChain(
    applicantAddress: string,
    role: number,
    votingDays: number = 7
): Promise<{ txHash: string; proposalId: number; autoApproved: boolean }> {
    const contract = getContract();

    // Centralized validation
    if (!ethers.isAddress(applicantAddress)) {
        throw new Error(`Invalid applicant address: '${applicantAddress}'. Must be a valid 0x hex address.`);
    }

    console.log(`[Blockchain] Calling proposeRegistration with applicant: ${applicantAddress}`);
    const tx = await contract.proposeRegistration(applicantAddress, role, votingDays);
    const receipt = await tx.wait();

    // In Ethers v6, we can use the contract interface to parse logs from the receipt
    let proposalId = -1;
    let autoApproved = false;

    console.log(`[Blockchain] Tx receipt logs count: ${receipt.logs.length}`);
    console.log(`[Blockchain] Full receipt logs:`, JSON.stringify(receipt.logs, null, 2));
    
    for (const log of receipt.logs) {
        try {
            const parsedLog = contract.interface.parseLog({
                topics: [...log.topics],
                data: log.data
            });

            console.log(`[Blockchain] Parsed log name: ${parsedLog?.name}`);
            console.log(`[Blockchain] Parsed log args:`, parsedLog?.args);

            if (parsedLog?.name === "RegistrationProposed") {
                proposalId = Number(parsedLog.args.proposalId);
                console.log(`[Blockchain] Found RegistrationProposed: ${proposalId}`);
            }
            if (parsedLog?.name === "RegistrationApproved") {
                autoApproved = true;
                console.log(`[Blockchain] Found RegistrationApproved`);
            }
        } catch (e) {
            console.log(`[Blockchain] Failed to parse log:`, e);
            // Log might not belong to this contract, skip
            continue;
        }
    }

    if (proposalId === -1) {
        console.warn(`[Blockchain] Transaction ${receipt.hash} successful but RegistrationProposed event not found in logs. Using count fallback.`);
        try {
            const count = await contract.proposalCount();
            const totalCount = Number(count);
            proposalId = totalCount; // Use the current count as the new proposal ID
            console.log(`[Blockchain] Fallback proposalId: ${proposalId} (total count: ${totalCount})`);
        } catch (e) {
            console.error(`[Blockchain] Fallback failed:`, e);
            // As last resort, query database for the highest proposalId and increment
            try {
                const mongoose = require('mongoose');
                if (mongoose.connection.readyState !== 1) {
                    await mongoose.connect('mongodb://localhost:27017/genomic-data-platform');
                }
                const db = mongoose.connection.db;
                const lastProposal = await db.collection('registrationrequests')
                    .find({ proposalId: { $gt: 0 } })
                    .sort({ proposalId: -1 })
                    .limit(1)
                    .toArray();
                
                proposalId = lastProposal.length > 0 ? lastProposal[0].proposalId + 1 : 1;
                console.log(`[Blockchain] Database fallback proposalId: ${proposalId}`);
            } catch (dbError) {
                console.error(`[Blockchain] Database fallback failed:`, dbError);
                proposalId = 1; // Ultimate fallback
                console.log(`[Blockchain] Using ultimate fallback proposalId: 1`);
            }
        }
    }

    return { txHash: receipt.hash, proposalId, autoApproved };
}

/**
 * Vote on a registration proposal on-chain
 * @returns Transaction hash and whether proposal was resolved
 */
export async function voteOnRegistrationOnChain(
    proposalId: number,
    approve: boolean,
    voterAddress: string
): Promise<{ txHash: string; resolved: boolean; approved: boolean }> {
    const contract = getContract();
    const tx = await contract.voteOnRegistration(proposalId, approve, voterAddress);
    const receipt = await tx.wait();

    const resolvedEvent = receipt.logs
        .map((log: ethers.Log) => {
            try {
                return contract.interface.parseLog({ topics: [...log.topics], data: log.data });
            } catch {
                return null;
            }
        })
        .find((e: ethers.LogDescription | null) =>
            e?.name === "RegistrationApproved" || e?.name === "RegistrationRejected"
        );

    return {
        txHash: receipt.hash,
        resolved: !!resolvedEvent,
        approved: resolvedEvent?.name === "RegistrationApproved",
    };
}

/**
 * Finalize a registration proposal after deadline
 * @returns Transaction hash and whether it was approved
 */
export async function finalizeRegistrationOnChain(
    proposalId: number
): Promise<{ txHash: string; approved: boolean }> {
    const contract = getContract();
    const tx = await contract.finalizeRegistration(proposalId);
    const receipt = await tx.wait();

    const approvedEvent = receipt.logs
        .map((log: ethers.Log) => {
            try {
                return contract.interface.parseLog({ topics: [...log.topics], data: log.data });
            } catch {
                return null;
            }
        })
        .find((e: ethers.LogDescription | null) => e?.name === "RegistrationApproved");

    return { txHash: receipt.hash, approved: !!approvedEvent };
}

/**
 * Get on-chain proposal details
 */
export async function getProposalDetails(proposalId: number): Promise<{
    applicant: string;
    requestedRole: number;
    approveCount: number;
    rejectCount: number;
    deadline: number;
    status: number;
}> {
    const contract = getContract();
    const result = await contract.getProposal(proposalId);
    return {
        applicant: result[0],
        requestedRole: Number(result[1]),
        approveCount: Number(result[2]),
        rejectCount: Number(result[3]),
        deadline: Number(result[4]),
        status: Number(result[5]),
    };
}

// ===== Utility =====

/**
 * Check if blockchain is reachable
 */
export async function isBlockchainAvailable(): Promise<boolean> {
    try {
        const provider = createProvider();
        await provider.getBlockNumber();
        return true;
    } catch {
        return false;
    }
}

/**
 * Get on-chain record count
 */
export async function getOnChainRecordCount(): Promise<number> {
    const contract = getContract();
    return Number(await contract.recordCount());
}

/**
 * Get on-chain genomic record details
 */
export async function getGenomicRecord(index: number): Promise<{
    pid: string;
    fileHash: string;
    fileId: string;
    registeredBy: string;
    timestamp: number;
}> {
    const contract = getContract();
    
    try {
        // First check if record exists by calling the contract's public mapping
        const record = await contract.genomicRecords(index);
        
        // Check if the record exists (the exists flag should be true)
        if (!record.exists) {
            throw new Error(`Genomic record at index ${index} does not exist or has been marked as non-existent`);
        }
        
        // If record exists, get the full record data
        const result = await contract.getGenomicRecord(index);
        return {
            pid: result[0],
            fileHash: result[1],
            fileId: result[2],
            registeredBy: result[3],
            timestamp: Number(result[4])
        };
    } catch (error: any) {
        // Handle contract revert errors gracefully
        if (error.message && error.message.includes('Record does not exist')) {
            throw new Error(`Genomic record at index ${index} does not exist on-chain`);
        }
        if (error.message && error.message.includes('could not decode result data')) {
            throw new Error(`Genomic record at index ${index} returned empty data - record may not exist`);
        }
        throw error;
    }
}

/**
 * Check if a genomic record exists on-chain
 */
export async function genomicRecordExists(index: number): Promise<boolean> {
    const contract = getContract();
    try {
        const record = await contract.genomicRecords(index);
        return record.exists;
    } catch (error) {
        return false;
    }
}

/**
 * Get on-chain consent count
 */
export async function getOnChainConsentCount(): Promise<number> {
    const contract = getContract();
    return Number(await contract.consentCount());
}

