import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import connectDB from '@/lib/mongodb'
import { User } from '@/lib/models/User'
import { Lab } from '@/lib/models/Lab'
import { Researcher } from '@/lib/models/Researcher'

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const { walletAddress, role } = await request.json()

    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 })
    }

    const userRole = (role || 'PATIENT').toUpperCase()
    const walletLower = walletAddress.toLowerCase()

    console.log(`[Auth Connect] walletAddress=${walletLower}, role=${userRole}`)

    let user = await User.findOne({ walletAddress: walletLower, role: userRole })

    if (!user) {
      console.log('[Auth Connect] No existing user found, creating new...')

      // For LAB/RESEARCHER roles, look up wallet in Lab/Researcher collections
      let labId: string | undefined = undefined
      let researcherId: string | undefined = undefined
      let displayName: string | undefined = undefined
      let matchedEmail: string | undefined = undefined

      if (userRole === 'LAB') {
        const lab = await Lab.findOne({ walletAddress: walletLower }).lean()
        if (lab) {
          labId = (lab as Record<string, unknown>).labId as string
          displayName = (lab as Record<string, unknown>).name as string
          matchedEmail = (lab as Record<string, unknown>).email as string
          console.log(`[Auth Connect] Matched Lab: ${labId} - ${displayName}`)
        } else {
          return NextResponse.json({
            error: 'No lab found for this wallet address. Please register as a Lab first.'
          }, { status: 403 })
        }
      } else if (userRole === 'RESEARCHER') {
        const researcher = await Researcher.findOne({ walletAddress: walletLower }).lean()
        if (researcher) {
          researcherId = (researcher as Record<string, unknown>).researcherId as string
          displayName = (researcher as Record<string, unknown>).name as string
          matchedEmail = (researcher as Record<string, unknown>).email as string
          console.log(`[Auth Connect] Matched Researcher: ${researcherId} - ${displayName}`)
        } else {
          return NextResponse.json({
            error: 'No researcher found for this wallet address. Please register as a Researcher first.'
          }, { status: 403 })
        }
      }

      // Build user data — password placeholder for wallet-only users
      // (stale MongoDB validation may require `password` field)
      const walletShort = walletLower.slice(2, 10)
      const userData: Record<string, unknown> = {
        walletAddress: walletLower,
        role: userRole,
        displayName: displayName,
        password: crypto.randomBytes(32).toString('hex'), // never used for auth
      }

      if (userRole === 'PATIENT') {
        userData.pid = `PID-${walletLower.slice(2, 8)}`
      } else if (userRole === 'LAB') {
        userData.labId = labId
        userData.email = matchedEmail || `wallet-${walletShort}@lab.local`
      } else if (userRole === 'RESEARCHER') {
        userData.researcherId = researcherId
        userData.email = matchedEmail || `wallet-${walletShort}@researcher.local`
      }

      try {
        user = new User(userData)
        await user.save()
        console.log(`[Auth Connect] Created new user: ${user._id}`)
      } catch (saveError: unknown) {
        const mongoError = saveError as { code?: number; message?: string }
        console.error('[Auth Connect] Save error:', mongoError.message)
        // If duplicate key error, try to find the existing user again
        if (mongoError.code === 11000) {
          user = await User.findOne({ walletAddress: walletLower, role: userRole })
          if (!user) {
            return NextResponse.json({ error: 'Duplicate user conflict. Try re-seeding: npm run seed' }, { status: 409 })
          }
        } else {
          return NextResponse.json({ error: `User creation failed: ${mongoError.message}` }, { status: 500 })
        }
      }
    }

    // Fetch enriched details
    let labDetails = null
    let researcherDetails = null

    if (user.role === 'LAB' && user.labId) {
      labDetails = await Lab.findOne({ labId: user.labId }).lean()
    }
    if (user.role === 'RESEARCHER' && user.researcherId) {
      researcherDetails = await Researcher.findOne({ researcherId: user.researcherId }).lean()
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        walletAddress: user.walletAddress,
        isAdmin: user.isAdmin,
        pid: user.pid,
        labId: user.labId,
        researcherId: user.researcherId,
        displayName: user.displayName,
        lab: labDetails,
        researcher: researcherDetails,
      }
    })

  } catch (error: unknown) {
    const err = error as { message?: string }
    console.error('Auth connect error:', err.message || error)
    return NextResponse.json({ error: `Internal server error: ${err.message || 'Unknown'}` }, { status: 500 })
  }
}
