const FormData = require('form-data');

// IPFS HTTP API client (uses port 5001)
class IPFSHTTPClient {
  constructor(apiUrl = 'http://127.0.0.1:5001/api/v0') {
    this.apiUrl = apiUrl;
  }

  // Add file to IPFS using HTTP API
  async add(fileBuffer, fileName) {
    try {
      console.log(`[IPFS HTTP] Adding file: ${fileName}`);

      const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substr(2, 16);

      // Use Buffer to handle binary data correctly
      const header = Buffer.from([
        `--${boundary}`,
        `Content-Disposition: form-data; name="file"; filename="${fileName}"`,
        'Content-Type: application/octet-stream',
        '',
        ''
      ].join('\r\n'));

      const footer = Buffer.from(`\r\n--${boundary}--\r\n`);

      const body = Buffer.concat([
        header,
        fileBuffer,
        footer
      ]);

      console.log(`[DEBUG] Request body length: ${body.length}`);
      console.log(`[DEBUG] File buffer length: ${fileBuffer.length}`);

      const response = await fetch(`${this.apiUrl}/add?pin=true`, {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': body.length.toString()
        },
        body: body
      });

      console.log(`[DEBUG] Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.log(`[DEBUG] Error response: ${errorText}`);
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log(`[DEBUG] Upload result:`, result);

      if (!result || !result.Hash) {
        throw new Error('Invalid response from IPFS API');
      }

      return { cid: result.Hash };
    } catch (error) {
      throw new Error(`Failed to add to IPFS via HTTP: ${error.message}`);
    }
  }

  // Pin file to IPFS
  async pinAdd(cid) {
    try {
      const response = await fetch(`${this.apiUrl}/pin/add?arg=${cid}`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`[IPFS] File pinned: CID=${cid}`);
    } catch (error) {
      throw new Error(`Failed to pin to IPFS: ${error.message}`);
    }
  }

  // Retrieve file content from IPFS by CID
  async cat(cid) {
    try {
      console.log(`[IPFS HTTP] Fetching content: CID=${cid}`);

      const response = await fetch(`${this.apiUrl}/cat?arg=${cid}`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      return Buffer.from(buffer);
    } catch (error) {
      throw new Error(`Failed to cat from IPFS: ${error.message}`);
    }
  }

  // Get IPFS version
  async version() {
    try {
      const response = await fetch(`${this.apiUrl}/version`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();
      console.log('[DEBUG] IPFS version response:', responseText);

      // Parse JSON manually to handle potential formatting issues
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('[DEBUG] JSON parse error:', parseError);
        throw new Error(`Invalid JSON response from IPFS: ${responseText.substring(0, 100)}`);
      }

      return { version: result.Version || result.version };
    } catch (error) {
      throw new Error(`Failed to get IPFS version: ${error.message}`);
    }
  }

  // Check if IPFS is available
  async isAvailable() {
    try {
      // Try a simple ping to the API instead of version
      const response = await fetch(`${this.apiUrl}/id`, {
        method: 'POST'
      });

      // If we get any response (even error), IPFS is running
      return true;
    } catch (error) {
      console.warn('IPFS HTTP API not available:', error.message);
      return false;
    }
  }
}

let ipfsClient = null;

// Initialize IPFS client
function getIPFSClient() {
  if (!ipfsClient) {
    let apiUrl = process.env.IPFS_API_URL || 'http://127.0.0.1:5001';

    // Ensure API version suffix is present
    if (!apiUrl.includes('/api/v0')) {
      // Remove trailing slash if any
      apiUrl = apiUrl.replace(/\/$/, '');
      apiUrl += '/api/v0';
    }

    console.log(`[IPFS] Initializing client with API URL: ${apiUrl}`);
    ipfsClient = new IPFSHTTPClient(apiUrl);
  }
  return ipfsClient;
}

// Encrypt file before uploading to IPFS
async function encryptFile(buffer, encryptionKey) {
  const crypto = require('crypto');
  const algorithm = 'aes-256-cbc';
  const key = crypto.createHash('sha256').update(encryptionKey + 'salt').digest();
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([iv, cipher.update(buffer), cipher.final()]);

  return encrypted;
}

// Upload file to IPFS with encryption using HTTP API
async function uploadToIPFS(fileBuffer, fileName, encryptionKey) {
  try {
    const client = getIPFSClient();

    let dataToUpload = fileBuffer;
    let encrypted = false;

    // Encrypt file if encryption key is provided
    if (encryptionKey) {
      dataToUpload = await encryptFile(fileBuffer, encryptionKey);
      encrypted = true;
    }

    console.log(`[DEBUG] Upload file: ${fileName}`);
    console.log(`[DEBUG] File size: ${dataToUpload.length} bytes`);
    console.log(`[DEBUG] Encrypted: ${encrypted}`);

    // Add file to IPFS via HTTP API
    const result = await client.add(dataToUpload, fileName);

    console.log(`[IPFS HTTP] File uploaded: CID=${result.cid}, encrypted=${encrypted}`);

    // Also add to MFS so it shows up in "Files" tab of IPFS WebUI
    try {
      const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const mfsPath = `/gen-share/${Date.now()}_${sanitizedName}`;

      console.log(`[IPFS MFS] Attempting to copy to MFS: ${mfsPath}`);

      // 1. Ensure directory exists
      await fetch(`${client.apiUrl}/files/mkdir?arg=/gen-share&parents=true`, { method: 'POST' });

      // 2. Add to MFS (copy from CID)
      const cpRes = await fetch(`${client.apiUrl}/files/cp?arg=/ipfs/${result.cid}&arg=${mfsPath}`, { method: 'POST' });

      if (cpRes.ok) {
        console.log(`[IPFS MFS] File successfully copied to MFS: ${mfsPath}`);
      } else {
        const cpErr = await cpRes.text();
        console.warn(`[IPFS MFS] Failed to copy to MFS: ${cpErr}`);
      }
    } catch (mfsError) {
      console.warn('[IPFS MFS] Error during MFS operation:', mfsError.message);
    }

    return {
      cid: result.cid,
      encrypted
    };
  } catch (error) {
    console.error('IPFS HTTP upload error:', error);
    throw new Error(`Failed to upload to IPFS: ${error.message}`);
  }
}

// Decrypt file downloaded from IPFS
function decryptFile(encryptedBuffer, decryptionKey) {
  const crypto = require('crypto');
  const algorithm = 'aes-256-cbc';
  const key = crypto.createHash('sha256').update(decryptionKey + 'salt').digest();
  // IV is prepended to the encrypted data (first 16 bytes)
  const iv = encryptedBuffer.subarray(0, 16);
  const encryptedData = encryptedBuffer.subarray(16);

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
}

// Download file from IPFS with optional decryption
async function downloadFromIPFS(cid, decryptionKey) {
  try {
    const client = getIPFSClient();
    let data = await client.cat(cid);

    if (decryptionKey) {
      data = decryptFile(data, decryptionKey);
      console.log(`[IPFS] File decrypted: CID=${cid}`);
    }

    console.log(`[IPFS HTTP] File downloaded: CID=${cid}, size=${data.length} bytes`);
    return data;
  } catch (error) {
    console.error('IPFS HTTP download error:', error);
    throw new Error(`Failed to download from IPFS: ${error.message}`);
  }
}

// Get IPFS gateway URL for file access
function getIPFSGatewayURL(cid) {
  return `${process.env.IPFS_GATEWAY_URL || 'http://127.0.0.1:8080'}/ipfs/${cid}`;
}

// Check if IPFS node is available
async function checkIPFSAvailability() {
  try {
    const client = getIPFSClient();
    return await client.isAvailable();
  } catch (error) {
    console.warn('IPFS HTTP node not available:', error.message);
    return false;
  }
}

// Pin file to IPFS (to prevent garbage collection)
async function pinToIPFS(cid) {
  try {
    const client = getIPFSClient();
    await client.pinAdd(cid);
  } catch (error) {
    console.error('IPFS HTTP pin error:', error);
    throw new Error(`Failed to pin to IPFS: ${error.message}`);
  }
}

module.exports = {
  uploadToIPFS,
  downloadFromIPFS,
  getIPFSGatewayURL,
  checkIPFSAvailability,
  pinToIPFS
};
