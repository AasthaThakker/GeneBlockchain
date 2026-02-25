import FormData from 'form-data'

// IPFS HTTP API client (uses port 5001)
class IPFSHTTPClient {
  private apiUrl: string

  constructor(apiUrl: string = 'http://127.0.0.1:5001/api/v0') {
    this.apiUrl = apiUrl
  }

  // Add file to IPFS using HTTP API
  async add(fileBuffer: Buffer, fileName: string): Promise<{ cid: string }> {
    try {
      console.log(`[IPFS HTTP] Adding file: ${fileName}`)

      const boundary = '----formdata-ipfs-' + Math.random().toString(36).substr(2, 16)

      // Use Buffer to handle binary data correctly
      const header = Buffer.from([
        `--${boundary}`,
        `Content-Disposition: form-data; name="file"; filename="${fileName}"`,
        'Content-Type: application/octet-stream',
        '',
        ''
      ].join('\r\n'))

      const footer = Buffer.from(`\r\n--${boundary}--\r\n`)

      const body = Buffer.concat([
        header,
        fileBuffer,
        footer
      ])

      const response = await fetch(`${this.apiUrl}/add?pin=true`, {
        method: 'POST',
        body: body,
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': body.length.toString()
        }
      }) as any

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`)
      }

      const result = await response.json()

      if (!result || !result.Hash) {
        throw new Error('Invalid response from IPFS API')
      }

      return { cid: result.Hash }
    } catch (error) {
      throw new Error(`Failed to add to IPFS via HTTP: ${(error as Error).message}`)
    }
  }

  // Pin file to IPFS
  async pinAdd(cid: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/pin/add?arg=${cid}`, {
        method: 'POST'
      }) as any

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log(`[IPFS] File pinned: CID=${cid}`)
    } catch (error) {
      throw new Error(`Failed to pin to IPFS: ${(error as Error).message}`)
    }
  }

  // Retrieve file content from IPFS by CID
  async cat(cid: string): Promise<Buffer> {
    try {
      console.log(`[IPFS HTTP] Fetching content: CID=${cid}`)

      const response = await fetch(`${this.apiUrl}/cat?arg=${cid}`, {
        method: 'POST'
      }) as any

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const buffer = await response.buffer()
      return buffer
    } catch (error) {
      throw new Error(`Failed to cat from IPFS: ${(error as Error).message}`)
    }
  }

  // Get IPFS version
  async version(): Promise<{ version: string }> {
    try {
      const response = await fetch(`${this.apiUrl}/version`, {
        method: 'POST'
      }) as any

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      return { version: result.Version || result.version }
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
      console.warn('IPFS HTTP API not available:', (error as Error).message)
      return false
    }
  }
}

let ipfsClient: IPFSHTTPClient | null = null

// Initialize IPFS client
function getIPFSClient(): IPFSHTTPClient {
  if (!ipfsClient) {
    let apiUrl = process.env.IPFS_API_URL || 'http://127.0.0.1:5001'

    // Ensure API version suffix is present
    if (!apiUrl.includes('/api/v0')) {
      // Remove trailing slash if any
      apiUrl = apiUrl.replace(/\/$/, '')
      apiUrl += '/api/v0'
    }

    console.log(`[IPFS] Initializing client with API URL: ${apiUrl}`)
    ipfsClient = new IPFSHTTPClient(apiUrl)
  }
  return ipfsClient
}

// Encrypt file before uploading to IPFS
async function encryptFile(buffer: Buffer, encryptionKey: string): Promise<Buffer> {
  const crypto = require('crypto')
  const algorithm = 'aes-256-cbc'
  const key = crypto.createHash('sha256').update(encryptionKey + 'salt').digest()
  const iv = crypto.randomBytes(16)

  const cipher = crypto.createCipheriv(algorithm, key, iv)
  const encrypted = Buffer.concat([iv, cipher.update(buffer), cipher.final()])

  return encrypted
}

// Upload file to IPFS with encryption using HTTP API
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

    console.log(`[DEBUG] Upload file: ${fileName}`)
    console.log(`[DEBUG] File size: ${dataToUpload.length} bytes`)
    console.log(`[DEBUG] Encrypted: ${encrypted}`)

    // Add file to IPFS via HTTP API
    const result = await client.add(dataToUpload, fileName)

    console.log(`[IPFS HTTP] File uploaded: CID=${result.cid}, encrypted=${encrypted}`)

    // Also add to MFS so it shows up in "Files" tab of IPFS WebUI
    try {
      const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
      const mfsPath = `/gen-share/${Date.now()}_${sanitizedName}`

      console.log(`[IPFS MFS] Attempting to copy to MFS: ${mfsPath}`)

      // 1. Ensure directory exists
      await fetch(`${(client as any).apiUrl}/files/mkdir?arg=/gen-share&parents=true`, { method: 'POST' })

      // 2. Add to MFS (copy from CID)
      const cpRes = await fetch(`${(client as any).apiUrl}/files/cp?arg=/ipfs/${result.cid}&arg=${mfsPath}`, { method: 'POST' })

      if (cpRes.ok) {
        console.log(`[IPFS MFS] File successfully copied to MFS: ${mfsPath}`)
      } else {
        const cpErr = await cpRes.text()
        console.warn(`[IPFS MFS] Failed to copy to MFS: ${cpErr}`)
      }
    } catch (mfsError) {
      console.warn('[IPFS MFS] Error during MFS operation:', (mfsError as Error).message)
    }

    return {
      cid: result.cid,
      encrypted
    }
  } catch (error) {
    console.error('IPFS HTTP upload error:', error)
    throw new Error(`Failed to upload to IPFS: ${(error as Error).message}`)
  }
}

// Decrypt file downloaded from IPFS
function decryptFile(encryptedBuffer: Buffer, decryptionKey: string): Buffer {
  const crypto = require('crypto')
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

    console.log(`[IPFS HTTP] File downloaded: CID=${cid}, size=${data.length} bytes`)
    return data
  } catch (error) {
    console.error('IPFS HTTP download error:', error)
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
    console.warn('IPFS HTTP node not available:', (error as Error).message)
    return false
  }
}

// Pin file to IPFS (to prevent garbage collection)
export async function pinToIPFS(cid: string): Promise<void> {
  try {
    const client = getIPFSClient()
    await client.pinAdd(cid)
  } catch (error) {
    console.error('IPFS HTTP pin error:', error)
    throw new Error(`Failed to pin to IPFS: ${(error as Error).message}`)
  }
}
