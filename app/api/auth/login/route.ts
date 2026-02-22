import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { User } from '@/lib/models/User'
import { Lab } from '@/lib/models/Lab'
import { Researcher } from '@/lib/models/Researcher'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const { email, password, role } = await request.json()

    if (!email || !password || !role) {
      return NextResponse.json({ error: 'Email, password, and role are required' }, { status: 400 })
    }

    const userRole = role.toUpperCase()
    const user = await User.findOne({ email: email.toLowerCase(), role: userRole })

    if (!user || !user.password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
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

  } catch (error) {
    console.error('Auth login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
