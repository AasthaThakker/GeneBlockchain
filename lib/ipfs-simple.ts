import crypto from 'crypto'
import { promisify } from 'util'

// IPFS configuration
const IPFS_API_URL = process.env.IPFS_API_URL || 'http://127.0.0.1:5001'
const IPFS_GATEWAY_URL = process.env.IPFS_GATEWAY_URL || 'http://127.0.0.1:8080'

// Simple HTTP-based IPFS client (without electron dependencies)
class SimpleIPFSClient {
  private apiUrl: string

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl
  }

  // Add file to IPFS using HTTP API
  async add(data: Buffer | string, filename?: string): Promise<{ cid: string }> {
    try {
      const fileData = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8')
      const fileName = filename || 'file'
      
      // Use curl-style multipart form data
      const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substr(2, 16)
      
      const formData = [
        `--${boundary}`,
        `Content-Disposition: form-data; name="file"; filename="${fileName}"`,
        `Content-Type: application/octet-stream`,
        '',
        fileData.toString('base64'),
        `--${boundary}--`
      ].join('\r\n')
      
      const response = await fetch(`${this.apiUrl}/api/v0/add`, {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error(`IPFS API error: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      return { cid: result.Hash }
    } catch (error) {
      throw new Error(`Failed to add to IPFS: ${(error as Error).message}`)
    }
  }

  // Get file from IPFS using HTTP API
  async cat(cid: string): Promise<Buffer> {
    try {
      const response = await fetch(`${this.apiUrl}/api/v0/cat?arg=${cid}`)
      
      if (!response.ok) {
        throw new Error(`IPFS API error: ${response.status} ${response.statusText}`)
      }

      if (!response.body) {
        throw new Error('No response body from IPFS')
      }

      const arrayBuffer = await response.arrayBuffer()
      return Buffer.from(arrayBuffer)
    } catch (error) {
      throw new Error(`Failed to get from IPFS: ${(error as Error).message}`)
    }
  }

  // Pin file to IPFS
  async pinAdd(cid: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/api/v0/pin/add?arg=${cid}`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error(`IPFS API error: ${response.status} ${response.statusText}`)
      }

      await response.json()
    } catch (error) {
      throw new Error(`Failed to pin to IPFS: ${(error as Error).message}`)
    }
  }

  // Get IPFS version
  async version(): Promise<{ version: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/api/v0/version`)
      
      if (!response.ok) {
        throw new Error(`IPFS API error: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      return { version: result.Version || result.version }
    } catch (error) {
      throw new Error(`Failed to get IPFS version: ${(error as Error).message}`)
    }
  }
}

let ipfsClient: SimpleIPFSClient | null = null

// Initialize IPFS client
function getIPFSClient(): SimpleIPFSClient {
  if (!ipfsClient) {
    ipfsClient = new SimpleIPFSClient(IPFS_API_URL)
  }
  return ipfsClient
}

// Encrypt file before uploading to IPFS
async function encryptFile(buffer: Buffer, encryptionKey: string): Promise<Buffer> {
  const algorithm = 'aes-256-cbc'
  const key = crypto.scryptSync(encryptionKey, 'salt', 32)
  const iv = crypto.randomBytes(16)
  
  const cipher = crypto.createCipheriv(algorithm, key, iv)
  const encrypted = Buffer.concat([iv, cipher.update(buffer), cipher.final()])
  
  return encrypted
}

// Upload file to IPFS with encryption
export async function uploadToIPFS(
  fileBuffer: Buffer,
  fileName: string,
  encryptionKey?: string
): Promise<{ cid: string; encrypted: boolean }> {
  try {
    const client = getIPFSClient()
    
    let dataToUpload = fileBuffer
    let encrypted = false
    
    // Encrypt file if encryption key is provided
    if (encryptionKey) {
      dataToUpload = await encryptFile(fileBuffer, encryptionKey)
      encrypted = true
    }
    
    // Add file to IPFS
    const result = await client.add(dataToUpload, fileName)
    
    console.log(`[IPFS] File uploaded: CID=${result.cid}, encrypted=${encrypted}`)
    
    return {
      cid: result.cid,
      encrypted
    }
  } catch (error) {
    console.error('IPFS upload error:', error)
    throw new Error(`Failed to upload to IPFS: ${(error as Error).message}`)
  }
}

// Download file from IPFS
export async function downloadFromIPFS(
  cid: string,
  decryptionKey?: string
): Promise<Buffer> {
  try {
    const client = getIPFSClient()
    
    // Get file from IPFS
    let fileBuffer = await client.cat(cid)
    
    // Decrypt file if decryption key is provided
    if (decryptionKey) {
      fileBuffer = await decryptFile(fileBuffer, decryptionKey)
    }
    
    return fileBuffer
  } catch (error) {
    console.error('IPFS download error:', error)
    throw new Error(`Failed to download from IPFS: ${(error as Error).message}`)
  }
}

// Decrypt file downloaded from IPFS
async function decryptFile(encryptedBuffer: Buffer, decryptionKey: string): Promise<Buffer> {
  const algorithm = 'aes-256-cbc'
  const key = crypto.scryptSync(decryptionKey, 'salt', 32)
  const iv = encryptedBuffer.slice(0, 16)
  const encryptedData = encryptedBuffer.slice(16)
  
  const decipher = crypto.createDecipheriv(algorithm, key, iv)
  const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()])
  
  return decrypted
}

// Get IPFS gateway URL for file access
export function getIPFSGatewayURL(cid: string): string {
  return `${IPFS_GATEWAY_URL}/ipfs/${cid}`
}

// Check if IPFS node is available
export async function checkIPFSAvailability(): Promise<boolean> {
  try {
    const client = getIPFSClient()
    await client.version()
    return true
  } catch (error) {
    console.warn('IPFS node not available:', (error as Error).message)
    return false
  }
}

// Pin file to IPFS (to prevent garbage collection)
export async function pinToIPFS(cid: string): Promise<void> {
  try {
    const client = getIPFSClient()
    await client.pinAdd(cid)
    console.log(`[IPFS] File pinned: CID=${cid}`)
  } catch (error) {
    console.error('IPFS pin error:', error)
    throw new Error(`Failed to pin to IPFS: ${(error as Error).message}`)
  }
}
