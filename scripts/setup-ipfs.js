#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🚀 Setting up IPFS for GeneBlockchain...\n')

// Check if IPFS is installed
function checkIPFSInstalled() {
  try {
    execSync('ipfs --version', { stdio: 'pipe' })
    return true
  } catch (error) {
    return false
  }
}

// Install IPFS (for different platforms)
function installIPFS() {
  console.log('📦 Installing IPFS...')
  
  const platform = process.platform
  
  if (platform === 'darwin') {
    console.log('Installing IPFS on macOS using Homebrew...')
    execSync('brew install ipfs', { stdio: 'inherit' })
  } else if (platform === 'linux') {
    console.log('Installing IPFS on Linux...')
    execSync('curl -L https://dist.ipfs.tech/kubo/v0.28.0/kubo_v0.28.0_linux-amd64.tar.gz -o kubo.tar.gz', { stdio: 'inherit' })
    execSync('tar -xvzf kubo.tar.gz', { stdio: 'inherit' })
    execSync('cd kubo && sudo ./install.sh', { stdio: 'inherit' })
    execSync('rm -rf kubo kubo.tar.gz', { stdio: 'inherit' })
  } else if (platform === 'win32') {
    console.log('Installing IPFS on Windows...')
    console.log('Please download IPFS from: https://dist.ipfs.tech/kubo/v0.28.0/kubo_v0.28.0_windows-amd64.zip')
    console.log('Extract and add to PATH, then run this script again.')
    process.exit(1)
  } else {
    console.log('Unsupported platform. Please install IPFS manually from https://docs.ipfs.tech/install/')
    process.exit(1)
  }
}

// Initialize IPFS repository
function initializeIPFS() {
  try {
    execSync('ipfs init', { stdio: 'inherit' })
    console.log('✅ IPFS repository initialized')
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('✅ IPFS repository already exists')
    } else {
      console.error('❌ Failed to initialize IPFS:', error.message)
      throw error
    }
  }
}

// Configure IPFS
function configureIPFS() {
  console.log('⚙️  Configuring IPFS...')
  
  // Enable CORS for web UI
  try {
    execSync('ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin \'["*"]\'', { stdio: 'pipe' })
    execSync('ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods \'["PUT", "POST", "GET"]\'', { stdio: 'pipe' })
    console.log('✅ CORS configured')
  } catch (error) {
    console.warn('⚠️  Failed to configure CORS:', error.message)
  }
  
  // Set up gateway
  try {
    execSync('ipfs config Addresses.Gateway \'/ip4/127.0.0.1/tcp/8080\'', { stdio: 'pipe' })
    console.log('✅ Gateway configured on port 8080')
  } catch (error) {
    console.warn('⚠️  Failed to configure gateway:', error.message)
  }
}

// Create package.json scripts
function addPackageScripts() {
  const packageJsonPath = path.join(__dirname, '../package.json')
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
  
  const ipfsScripts = {
    'ipfs:daemon': 'ipfs daemon --enable-pubsub-experiment',
    'ipfs:start': 'npm run ipfs:daemon',
    'ipfs:stop': 'pkill -f ipfs',
    'ipfs:status': 'ipfs id',
    'ipfs:logs': 'ipfs logs'
  }
  
  packageJson.scripts = { ...packageJson.scripts, ...ipfsScripts }
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
  console.log('✅ Added IPFS scripts to package.json')
}

// Main setup function
async function setupIPFS() {
  try {
    // Check if IPFS is installed
    if (!checkIPFSInstalled()) {
      console.log('❌ IPFS not found')
      installIPFS()
    } else {
      console.log('✅ IPFS is installed')
    }
    
    // Initialize IPFS
    initializeIPFS()
    
    // Configure IPFS
    configureIPFS()
    
    // Add package.json scripts
    addPackageScripts()
    
    console.log('\n🎉 IPFS setup complete!')
    console.log('\n📋 Next steps:')
    console.log('1. Start IPFS daemon: npm run ipfs:start')
    console.log('2. Start your app: npm run dev')
    console.log('3. Upload files through the Lab Upload page')
    console.log('4. Access IPFS Web UI: http://127.0.0.1:5001/webui')
    console.log('5. Access files via gateway: http://127.0.0.1:8080/ipfs/<CID>')
    console.log('\n💡 To stop IPFS daemon: npm run ipfs:stop')
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message)
    process.exit(1)
  }
}

// Run setup
setupIPFS()
