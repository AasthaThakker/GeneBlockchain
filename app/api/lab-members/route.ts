import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import connectDB from '@/lib/mongodb'
import { User } from '@/lib/models/User'

export async function GET(request: NextRequest) {
    try {
        await connectDB()
        const { searchParams } = new URL(request.url)
        const labId = searchParams.get('labId')

        if (!labId) {
            return NextResponse.json({ error: 'labId is required' }, { status: 400 })
        }

        const members = await User.find({ labId, role: 'LAB' })
            .select('-password')
            .sort({ isAdmin: -1, createdAt: 1 })
            .lean()

        return NextResponse.json({ success: true, data: members })
    } catch (error) {
        console.error('Get lab members error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        await connectDB()
        const body = await request.json()
        const { labId, displayName, email, password, walletAddress, adminLabId } = body

        // Verify the requester is admin of this lab
        if (!adminLabId || adminLabId !== labId) {
            return NextResponse.json({ error: 'Only admins of this lab can add members' }, { status: 403 })
        }

        if (!labId || !displayName || !email || !password) {
            return NextResponse.json({ error: 'labId, displayName, email, and password are required' }, { status: 400 })
        }

        // Check for duplicate email
        const existing = await User.findOne({ email: email.toLowerCase(), role: 'LAB' })
        if (existing) {
            return NextResponse.json({ error: 'A lab user with this email already exists' }, { status: 409 })
        }

        const hashedPassword = await bcrypt.hash(password, 10)
        const wallet = walletAddress?.toLowerCase() || `0x${crypto.randomBytes(20).toString('hex')}`

        const user = new User({
            walletAddress: wallet,
            role: 'LAB',
            email: email.toLowerCase(),
            password: hashedPassword,
            displayName,
            labId,
            isAdmin: false,
        })

        await user.save()

        const result = user.toObject()
        delete result.password

        return NextResponse.json({ success: true, data: result })
    } catch (error: unknown) {
        const err = error as { message?: string }
        console.error('Create lab member error:', err.message)
        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
    }
}

export async function PATCH(request: NextRequest) {
    try {
        await connectDB()
        const body = await request.json()
        const { userId, displayName, email, adminLabId } = body

        if (!userId || !adminLabId) {
            return NextResponse.json({ error: 'userId and adminLabId are required' }, { status: 400 })
        }

        // Verify the target user belongs to the same lab
        const target = await User.findById(userId)
        if (!target || target.labId !== adminLabId) {
            return NextResponse.json({ error: 'User not found in your lab' }, { status: 404 })
        }

        const updates: Record<string, unknown> = {}
        if (displayName) updates.displayName = displayName
        if (email) updates.email = email.toLowerCase()

        const updated = await User.findByIdAndUpdate(userId, updates, { new: true })
            .select('-password')
            .lean()

        return NextResponse.json({ success: true, data: updated })
    } catch (error) {
        console.error('Update lab member error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        await connectDB()
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')
        const adminLabId = searchParams.get('adminLabId')

        if (!userId || !adminLabId) {
            return NextResponse.json({ error: 'userId and adminLabId are required' }, { status: 400 })
        }

        const target = await User.findById(userId)
        if (!target || target.labId !== adminLabId) {
            return NextResponse.json({ error: 'User not found in your lab' }, { status: 404 })
        }

        if (target.isAdmin) {
            return NextResponse.json({ error: 'Cannot delete lab admin' }, { status: 403 })
        }

        await User.findByIdAndDelete(userId)

        return NextResponse.json({ success: true, message: 'Member removed' })
    } catch (error) {
        console.error('Delete lab member error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
