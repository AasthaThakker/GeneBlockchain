import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import connectDB from '@/lib/mongodb'
import { RegistrationRequest } from '@/lib/models/RegistrationRequest'
import { User } from '@/lib/models/User'
import { Lab } from '@/lib/models/Lab'
import { Researcher } from '@/lib/models/Researcher'
import { proposeRegistrationOnChain } from '@/lib/blockchain'
import crypto from 'crypto'

const VOTING_DAYS = 7 // 7-day voting window

export async function POST(request: NextRequest) {
    try {
        await connectDB()

        const { name, email, password, role, walletAddress, institution } = await request.json()

        // Validate required fields
        if (!name || !email || !password || !role || !walletAddress) {
            return NextResponse.json(
                { error: 'Name, email, password, role, and wallet address are required' },
                { status: 400 }
            )
        }

        const userRole = role.toUpperCase()
        if (userRole !== 'LAB' && userRole !== 'RESEARCHER') {
            return NextResponse.json(
                { error: 'Only Lab or Researcher registration is supported' },
                { status: 400 }
            )
        }

        if (userRole === 'RESEARCHER' && !institution) {
            return NextResponse.json(
                { error: 'Institution is required for researcher registration' },
                { status: 400 }
            )
        }

        const walletLower = walletAddress.toLowerCase()
        const emailLower = email.toLowerCase()

        // Check if already registered
        const existingUser = await User.findOne({ walletAddress: walletLower, role: userRole })
        if (existingUser) {
            return NextResponse.json(
                { error: 'This wallet address is already registered for this role' },
                { status: 409 }
            )
        }

        // Check for pending registration
        const pendingRequest = await RegistrationRequest.findOne({
            applicantAddress: walletLower,
            role: userRole,
            status: 'pending'
        })
        if (pendingRequest) {
            return NextResponse.json(
                { error: 'You already have a pending registration request for this role' },
                { status: 409 }
            )
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12)

        // Role enum: Lab = 2, Researcher = 3
        const roleEnum = userRole === 'LAB' ? 2 : 3

        // Propose registration on-chain
        let proposalResult
        try {
            proposalResult = await proposeRegistrationOnChain(walletLower, roleEnum, VOTING_DAYS)
        } catch (blockchainError: unknown) {
            const err = blockchainError as { message?: string }
            console.error('[Register] Blockchain error:', err.message)
            return NextResponse.json(
                { error: `Blockchain registration failed: ${err.message || 'Unknown error'}` },
                { status: 500 }
            )
        }

        // Calculate expiry
        const expiresAt = new Date(Date.now() + VOTING_DAYS * 24 * 60 * 60 * 1000)

        // Save registration request to MongoDB
        const registrationRequest = new RegistrationRequest({
            applicantAddress: walletLower,
            role: userRole,
            name,
            email: emailLower,
            password: hashedPassword,
            institution: userRole === 'RESEARCHER' ? institution : undefined,
            proposalId: proposalResult.proposalId,
            status: proposalResult.autoApproved ? 'approved' : 'pending',
            txHash: proposalResult.txHash,
            expiresAt,
        })

        await registrationRequest.save()

        // If auto-approved (bootstrap case), create the User + Lab/Researcher records immediately
        if (proposalResult.autoApproved) {
            const roleId = userRole === 'LAB'
                ? `LAB-${crypto.randomBytes(4).toString('hex')}`
                : `RES-${crypto.randomBytes(4).toString('hex')}`

            if (userRole === 'LAB') {
                await Lab.create({
                    labId: roleId,
                    name,
                    email: emailLower,
                    walletAddress: walletLower,
                    verificationStatus: true,
                })
            } else {
                await Researcher.create({
                    researcherId: roleId,
                    name,
                    institution,
                    email: emailLower,
                    walletAddress: walletLower,
                    verificationStatus: true,
                })
            }

            await User.create({
                email: emailLower,
                password: hashedPassword,
                role: userRole,
                walletAddress: walletLower,
                isAdmin: false,
                displayName: name,
                labId: userRole === 'LAB' ? roleId : undefined,
                researcherId: userRole === 'RESEARCHER' ? roleId : undefined,
            })
        }

        return NextResponse.json({
            success: true,
            proposalId: proposalResult.proposalId,
            txHash: proposalResult.txHash,
            autoApproved: proposalResult.autoApproved,
            status: proposalResult.autoApproved ? 'approved' : 'pending',
            message: proposalResult.autoApproved
                ? 'Registration approved automatically (first member). You can now log in.'
                : 'Registration submitted. Existing members will vote on your application.',
            expiresAt: expiresAt.toISOString(),
        })

    } catch (error: unknown) {
        const err = error as { message?: string }
        console.error('[Register] Error:', err.message || error)
        return NextResponse.json(
            { error: `Registration failed: ${err.message || 'Unknown error'}` },
            { status: 500 }
        )
    }
}
