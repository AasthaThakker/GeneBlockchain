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

export async function PUT(request: NextRequest) {
    try {
        await connectDB()

        const { searchParams } = new URL(request.url)
        const walletAddress = searchParams.get('walletAddress')
        const role = searchParams.get('role')

        if (!walletAddress) {
            return NextResponse.json({ error: 'walletAddress is required' }, { status: 400 })
        }

        const body = await request.json()
        const query: Record<string, string> = { walletAddress: walletAddress.toLowerCase() }
        if (role) query.role = role.toUpperCase()

        const user = await User.findOne(query)
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Update user with demographic information
        const updatedUser = await User.findOneAndUpdate(
            { walletAddress: walletAddress.toLowerCase() },
            {
                $set: {
                    age: body.age !== undefined ? parseInt(body.age) : undefined,
                    gender: body.gender || undefined,
                    geographicRegion: body.geographicRegion || undefined,
                    chronicDiseases: body.chronicDiseases || undefined,
                    medications: body.medications || undefined,
                    familyHistory: body.familyHistory || undefined,
                    updatedAt: new Date()
                }
            },
            { new: true, runValidators: false }
        )

        if (!updatedUser) {
            return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            message: 'User profile updated successfully',
            user: {
                walletAddress: updatedUser.walletAddress,
                role: updatedUser.role,
                displayName: updatedUser.displayName,
                pid: updatedUser.pid,
                age: updatedUser.age,
                gender: updatedUser.gender,
                geographicRegion: updatedUser.geographicRegion,
                chronicDiseases: updatedUser.chronicDiseases,
                medications: updatedUser.medications,
                familyHistory: updatedUser.familyHistory,
                createdAt: updatedUser.createdAt,
                updatedAt: updatedUser.updatedAt
            }
        })

    } catch (error) {
        console.error('Update user profile error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
