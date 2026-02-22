import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import connectDB from '@/lib/mongodb'
import { User } from '@/lib/models/User'
import { Researcher } from '@/lib/models/Researcher'

export async function GET(request: NextRequest) {
    try {
        await connectDB()
        const { searchParams } = new URL(request.url)
        const institution = searchParams.get('institution')

        if (!institution) {
            return NextResponse.json({ error: 'institution is required' }, { status: 400 })
        }

        // Find all researchers in this institution
        const researchers = await Researcher.find({ institution }).lean()
        const researcherIds = researchers.map((r: Record<string, unknown>) => r.researcherId)

        // Get user records for these researchers
        const members = await User.find({ researcherId: { $in: researcherIds }, role: 'RESEARCHER' })
            .select('-password')
            .sort({ isAdmin: -1, createdAt: 1 })
            .lean()

        // Enrich with researcher details
        const enriched = members.map((m: Record<string, unknown>) => {
            const researcher = researchers.find((r: Record<string, unknown>) => r.researcherId === m.researcherId)
            return { ...m, institution: (researcher as Record<string, unknown>)?.institution, researcherName: (researcher as Record<string, unknown>)?.name }
        })

        return NextResponse.json({ success: true, data: enriched })
    } catch (error) {
        console.error('Get researcher members error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        await connectDB()
        const body = await request.json()
        const { institution, displayName, email, password, walletAddress, adminResearcherId } = body

        if (!adminResearcherId || !institution) {
            return NextResponse.json({ error: 'Only admins can add researchers' }, { status: 403 })
        }

        // Verify admin belongs to this institution
        const adminResearcher = await Researcher.findOne({ researcherId: adminResearcherId })
        if (!adminResearcher || adminResearcher.institution !== institution) {
            return NextResponse.json({ error: 'Admin does not belong to this institution' }, { status: 403 })
        }

        if (!displayName || !email || !password) {
            return NextResponse.json({ error: 'displayName, email, and password are required' }, { status: 400 })
        }

        // Check for duplicate email
        const existing = await User.findOne({ email: email.toLowerCase(), role: 'RESEARCHER' })
        if (existing) {
            return NextResponse.json({ error: 'A researcher with this email already exists' }, { status: 409 })
        }

        const hashedPassword = await bcrypt.hash(password, 10)
        const wallet = walletAddress?.toLowerCase() || `0x${crypto.randomBytes(20).toString('hex')}`

        // Create researcher profile
        const resCount = await Researcher.countDocuments()
        const researcherId = `RES-${String(resCount + 1).padStart(3, '0')}`

        await Researcher.create({
            researcherId,
            name: displayName,
            institution,
            email: email.toLowerCase(),
            walletAddress: wallet,
            verificationStatus: true,
        })

        // Create user
        const user = new User({
            walletAddress: wallet,
            role: 'RESEARCHER',
            email: email.toLowerCase(),
            password: hashedPassword,
            displayName,
            researcherId,
            isAdmin: false,
        })

        await user.save()

        const result = user.toObject()
        delete result.password

        return NextResponse.json({ success: true, data: { ...result, institution } })
    } catch (error: unknown) {
        const err = error as { message?: string }
        console.error('Create researcher member error:', err.message)
        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
    }
}

export async function PATCH(request: NextRequest) {
    try {
        await connectDB()
        const body = await request.json()
        const { userId, displayName, email, adminResearcherId } = body

        if (!userId || !adminResearcherId) {
            return NextResponse.json({ error: 'userId and adminResearcherId are required' }, { status: 400 })
        }

        const target = await User.findById(userId)
        if (!target || !target.researcherId) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Verify same institution
        const adminRes = await Researcher.findOne({ researcherId: adminResearcherId })
        const targetRes = await Researcher.findOne({ researcherId: target.researcherId })
        if (!adminRes || !targetRes || adminRes.institution !== targetRes.institution) {
            return NextResponse.json({ error: 'User not in your institution' }, { status: 403 })
        }

        const updates: Record<string, unknown> = {}
        if (displayName) {
            updates.displayName = displayName
            await Researcher.findOneAndUpdate({ researcherId: target.researcherId }, { name: displayName })
        }
        if (email) {
            updates.email = email.toLowerCase()
            await Researcher.findOneAndUpdate({ researcherId: target.researcherId }, { email: email.toLowerCase() })
        }

        const updated = await User.findByIdAndUpdate(userId, updates, { new: true })
            .select('-password')
            .lean()

        return NextResponse.json({ success: true, data: updated })
    } catch (error) {
        console.error('Update researcher member error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        await connectDB()
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')
        const adminResearcherId = searchParams.get('adminResearcherId')

        if (!userId || !adminResearcherId) {
            return NextResponse.json({ error: 'userId and adminResearcherId are required' }, { status: 400 })
        }

        const target = await User.findById(userId)
        if (!target || !target.researcherId) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        if (target.isAdmin) {
            return NextResponse.json({ error: 'Cannot delete research admin' }, { status: 403 })
        }

        // Verify same institution
        const adminRes = await Researcher.findOne({ researcherId: adminResearcherId })
        const targetRes = await Researcher.findOne({ researcherId: target.researcherId })
        if (!adminRes || !targetRes || adminRes.institution !== targetRes.institution) {
            return NextResponse.json({ error: 'User not in your institution' }, { status: 403 })
        }

        // Remove researcher profile and user
        await Researcher.findOneAndDelete({ researcherId: target.researcherId })
        await User.findByIdAndDelete(userId)

        return NextResponse.json({ success: true, message: 'Researcher removed' })
    } catch (error) {
        console.error('Delete researcher member error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
