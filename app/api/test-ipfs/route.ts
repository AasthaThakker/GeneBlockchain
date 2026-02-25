import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🧪 Testing IPFS HTTP module loading in API...')
    
    // Try to load the JavaScript module
    const ipfsModule = require('@/lib/ipfs-http.js')
    console.log('✅ IPFS HTTP module loaded successfully')
    console.log('📋 Available functions:', Object.keys(ipfsModule))
    
    // Test availability with detailed error logging
    try {
      console.log('🔍 Checking IPFS availability...')
      const available = await ipfsModule.checkIPFSAvailability()
      console.log('🔍 IPFS availability result:', available)
      
      return NextResponse.json({
        success: true,
        moduleLoaded: true,
        ipfsAvailable: available,
        functions: Object.keys(ipfsModule)
      })
    } catch (availabilityError) {
      console.error('❌ IPFS availability check failed:', availabilityError)
      return NextResponse.json({
        success: false,
        moduleLoaded: true,
        ipfsAvailable: false,
        error: availabilityError.message,
        functions: Object.keys(ipfsModule)
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('❌ Failed to load IPFS HTTP module:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      moduleLoaded: false
    }, { status: 500 })
  }
}
