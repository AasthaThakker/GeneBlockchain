import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { User } from '@/lib/models/User'
import { Lab } from '@/lib/models/Lab'
import { Researcher } from '@/lib/models/Researcher'

export async function GET(request: NextRequest) {
    try {
        await connectDB()

        const { searchParams } = new URL(request.url)
        const walletAddress = searchParams.get('walletAddress')
        const role = searchParams.get('role')

        if (!walletAddress) {
            return NextResponse.json({ error: 'walletAddress is required' }, { status: 400 })
        }

        const query: Record<string, string> = { walletAddress: walletAddress.toLowerCase() }
        if (role) query.role = role.toUpperCase()

        const user = await User.findOne(query).lean()

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Enrich with lab or researcher details
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
                ...user,
                lab: labDetails,
                researcher: researcherDetails
            }
        })
    } catch (error) {
        console.error('Get user profile error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
