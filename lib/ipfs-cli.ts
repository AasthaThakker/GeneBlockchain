import { exec } from 'child_process'
import { promisify } from 'util'
import * as crypto from 'crypto'

const execAsync = promisify(exec)

// IPFS configuration
const IPFS_BINARY = process.env.IPFS_BINARY_PATH || 'ipfs'

// CLI-based IPFS client (avoids HTTP API issues)
class IPFSCLIClient {
  private binaryPath: string

  constructor(binaryPath: string) {
    this.binaryPath = binaryPath
  }

  // Add file to IPFS using CLI
  async add(filePath: string): Promise<{ cid: string }> {
    try {
      console.log(`[IPFS CLI] Adding file: ${filePath}`)
      const { stdout, stderr } = await execAsync(`"${this.binaryPath}" add "${filePath}"`)

      if (stderr) {
        console.warn('IPFS CLI stderr:', stderr)
      }

      const lines = stdout.trim().split('\n')
      const lastLine = lines[lines.length - 1]
      // Output format: "added <CID> <filename>"
      const match = lastLine.match(/added\s+(\S+)\s+(.+)/)

      if (!match) {
        // Try alternative parsing — extract first word-like token as CID
        const altMatch = lastLine.match(/(\S+)\s+(.+)/)
        if (altMatch) {
          return { cid: altMatch[1] }
        }
        throw new Error('Failed to parse IPFS add output: ' + stdout)
      }

      return { cid: match[1] }
    } catch (error) {
      throw new Error(`Failed to add to IPFS: ${(error as Error).message}`)
    }
  }

  // Pin file to IPFS
  async pinAdd(cid: string): Promise<void> {
    try {
      await execAsync(`"${this.binaryPath}" pin add "${cid}"`)
      console.log(`[IPFS] File pinned: CID=${cid}`)
    } catch (error) {
      throw new Error(`Failed to pin to IPFS: ${(error as Error).message}`)
    }
  }

  // Retrieve file content from IPFS by CID
  async cat(cid: string): Promise<Buffer> {
    try {
      console.log(`[IPFS CLI] Fetching content: CID=${cid}`)
      const { stdout } = await execAsync(`"${this.binaryPath}" cat "${cid}"`, {
        encoding: 'buffer' as any,
        maxBuffer: 50 * 1024 * 1024, // 50MB max
      })
      return Buffer.from(stdout)
    } catch (error) {
      throw new Error(`Failed to cat from IPFS: ${(error as Error).message}`)
    }
  }

  // Get IPFS version
  async version(): Promise<{ version: string }> {
    try {
      const { stdout } = await execAsync(`"${this.binaryPath}" version`)
      const version = stdout.trim()
      return { version }
    } catch (error) {
      throw new Error(`Failed to get IPFS version: ${(error as Error).message}`)
    }
  }

  // Check if IPFS is available
  async isAvailable(): Promise<boolean> {
    try {
      await this.version()
      return true
    } catch (error) {
      console.warn('IPFS not available:', (error as Error).message)
      return false
    }
  }
}

let ipfsClient: IPFSCLIClient | null = null

// Initialize IPFS client
function getIPFSClient(): IPFSCLIClient {
  if (!ipfsClient) {
    ipfsClient = new IPFSCLIClient(IPFS_BINARY)
  }
  return ipfsClient
}

// Encrypt file before uploading to IPFS
async function encryptFile(buffer: Buffer, encryptionKey: string): Promise<Buffer> {
  const algorithm = 'aes-256-cbc'
  const key = crypto.createHash('sha256').update(encryptionKey + 'salt').digest()
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

    // Write temporary file with absolute path
    const fs = require('fs')
    const path = require('path')
    const tempPath = path.join(process.cwd(), `temp-${Date.now()}.bin`)
    fs.writeFileSync(tempPath, dataToUpload)

    console.log(`[DEBUG] Temp file created: ${tempPath}`)
    console.log(`[DEBUG] File exists: ${fs.existsSync(tempPath)}`)
    console.log(`[DEBUG] File size: ${fs.statSync(tempPath).size} bytes`)

    // Add file to IPFS
    const result = await client.add(tempPath)

    console.log(`[IPFS] Adding file: ${tempPath}`)

    // Clean up temp file
    try {
      fs.unlinkSync(tempPath)
    } catch (cleanupError: any) {
      console.warn('Warning: Could not clean up temp file:', cleanupError.message)
    }

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

// Decrypt file downloaded from IPFS
function decryptFile(encryptedBuffer: Buffer, decryptionKey: string): Buffer {
  const algorithm = 'aes-256-cbc'
  const key = crypto.createHash('sha256').update(decryptionKey + 'salt').digest()
  // IV is prepended to the encrypted data (first 16 bytes)
  const iv = encryptedBuffer.subarray(0, 16)
  const encryptedData = encryptedBuffer.subarray(16)

  const decipher = crypto.createDecipheriv(algorithm, key, iv)
  return Buffer.concat([decipher.update(encryptedData), decipher.final()])
}

// Download file from IPFS with optional decryption
export async function downloadFromIPFS(
  cid: string,
  decryptionKey?: string
): Promise<Buffer> {
  try {
    const client = getIPFSClient()
    let data = await client.cat(cid)

    if (decryptionKey) {
      data = decryptFile(data, decryptionKey)
      console.log(`[IPFS] File decrypted: CID=${cid}`)
    }

    console.log(`[IPFS] File downloaded: CID=${cid}, size=${data.length} bytes`)
    return data
  } catch (error) {
    console.error('IPFS download error:', error)
    throw new Error(`Failed to download from IPFS: ${(error as Error).message}`)
  }
}

// Get IPFS gateway URL for file access
export function getIPFSGatewayURL(cid: string): string {
  return `${process.env.IPFS_GATEWAY_URL || 'http://127.0.0.1:8080'}/ipfs/${cid}`
}

// Check if IPFS node is available
export async function checkIPFSAvailability(): Promise<boolean> {
  try {
    const client = getIPFSClient()
    return await client.isAvailable()
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
  } catch (error) {
    console.error('IPFS pin error:', error)
    throw new Error(`Failed to pin to IPFS: ${(error as Error).message}`)
  }
}
