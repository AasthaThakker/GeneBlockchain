import crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');

/**
 * Generate a unique file ID
 */
export function generateFileId(): string {
    return `FILE_${Date.now()}_${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
}

/**
 * Encrypt file data using AES-256-CBC
 * @param data - Buffer or string data to encrypt
 * @returns Encrypted data with IV
 */
export function encryptData(data: Buffer | string): { encrypted: Buffer; iv: Buffer } {
    const iv = crypto.randomBytes(16);
    const key = Buffer.from(ENCRYPTION_KEY, 'hex');
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted: Buffer;
    if (typeof data === 'string') {
        encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
    } else {
        encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
    }
    
    return { encrypted, iv };
}

/**
 * Decrypt file data using AES-256-CBC
 * @param encryptedData - Encrypted buffer
 * @param iv - Initialization vector
 * @returns Decrypted buffer
 */
export function decryptData(encryptedData: Buffer, iv: Buffer): Buffer {
    const key = Buffer.from(ENCRYPTION_KEY, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    
    return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
}

/**
 * Calculate SHA-256 hash of data
 * @param data - Buffer or string data
 * @returns SHA-256 hash as hex string
 */
export function calculateSHA256(data: Buffer | string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Verify SHA-256 hash matches data
 * @param data - Buffer or string data
 * @param expectedHash - Expected SHA-256 hash
 * @returns Boolean indicating if hash matches
 */
export function verifySHA256(data: Buffer | string, expectedHash: string): boolean {
    const actualHash = calculateSHA256(data);
    return actualHash === expectedHash.toLowerCase();
}

export { ENCRYPTION_KEY };
