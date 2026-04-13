import { ethers } from 'ethers';
import { CONTRACT_ABI, GENOMIC_ABI, VERIFICATION_ABI } from './contract-abi';

// Default Hardhat account #0 private key (well-known, only for local dev)
export const DEFAULT_HARDHAT_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

// Create provider instance
export function createProvider(rpcUrl?: string): ethers.JsonRpcProvider {
    return new ethers.JsonRpcProvider(rpcUrl || "http://127.0.0.1:8545");
}

// Create contract instance with full ABI
export function createContract(address: string, rpcUrl?: string): ethers.Contract {
    const provider = createProvider(rpcUrl);
    return new ethers.Contract(address, CONTRACT_ABI, provider);
}

// Create contract instance with specific ABI
export function createGenomicContract(address: string, rpcUrl?: string): ethers.Contract {
    const provider = createProvider(rpcUrl);
    return new ethers.Contract(address, GENOMIC_ABI, provider);
}

// Create contract instance with verification ABI
export function createVerificationContract(address: string, rpcUrl?: string): ethers.Contract {
    const provider = createProvider(rpcUrl);
    return new ethers.Contract(address, VERIFICATION_ABI, provider);
}

// Create signer for transactions
export function createSigner(privateKey?: string, rpcUrl?: string): ethers.Wallet {
    const provider = createProvider(rpcUrl);
    const key = privateKey || DEFAULT_HARDHAT_KEY;
    return new ethers.Wallet(key, provider);
}

// Create contract with signer for transactions
export function createContractWithSigner(address: string, privateKey?: string, rpcUrl?: string): ethers.Contract {
    const signer = createSigner(privateKey, rpcUrl);
    return new ethers.Contract(address, CONTRACT_ABI, signer);
}

// Decode transaction data
export function decodeTransaction(txData: string, abi: readonly string[] = CONTRACT_ABI): ethers.TransactionDescription {
    const iface = new ethers.Interface(abi as any[]);
    return iface.parseTransaction({ data: txData })!;
}

// Validate SHA-256 hash format
export function isValidSHA256(hash: string): boolean {
    return /^[a-f0-9]{64}$/i.test(hash);
}

// Format address for display
export function formatAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Format wei to ETH
export function formatWei(wei: string | bigint): string {
    return ethers.formatEther(wei);
}

// Format ETH to wei
export function formatEth(eth: string): bigint {
    return ethers.parseEther(eth);
}
