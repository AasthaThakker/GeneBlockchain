import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { RegistrationRequest } from '@/lib/models/RegistrationRequest'
import { User } from '@/lib/models/User'
import { Lab } from '@/lib/models/Lab'
import { Researcher } from '@/lib/models/Researcher'
import { voteOnRegistrationOnChain } from '@/lib/blockchain'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
    try {
        await connectDB()

        const { proposalId, approve, voterWallet } = await request.json()

        if (proposalId === undefined || approve === undefined || !voterWallet) {
            return NextResponse.json(
                { error: 'proposalId, approve (boolean), and voterWallet are required' },
                { status: 400 }
            )
        }

        const voterLower = voterWallet.toLowerCase()

        // Find the registration request
        const regRequest = await RegistrationRequest.findOne({ proposalId })
        if (!regRequest) {
            return NextResponse.json(
                { error: 'Registration request not found' },
                { status: 404 }
            )
        }

        // Validate proposalId is not -1 (invalid blockchain proposal)
        if (proposalId === -1) {
            return NextResponse.json(
                { error: 'Invalid proposal ID: Blockchain proposal creation failed. Please contact the applicant to resubmit registration.' },
                { status: 400 }
            )
        }

        if (regRequest.status !== 'pending') {
            return NextResponse.json(
                { error: `This registration has already been ${regRequest.status}` },
                { status: 400 }
            )
        }

        // Verify voter is a verified member of the same role
        const voterUser = await User.findOne({ walletAddress: voterLower, role: regRequest.role })
        if (!voterUser) {
            return NextResponse.json(
                { error: 'You are not a verified member of this role and cannot vote' },
                { status: 403 }
            )
        }

        // Check if already voted
        const alreadyVoted = regRequest.votes.some(
            (v: { voter: string }) => v.voter.toLowerCase() === voterLower
        )
        if (alreadyVoted) {
            return NextResponse.json(
                { error: 'You have already voted on this registration' },
                { status: 409 }
            )
        }

        // Cast vote on-chain
        let voteResult
        try {
            voteResult = await voteOnRegistrationOnChain(proposalId, approve, voterLower)
        } catch (blockchainError: unknown) {
            const err = blockchainError as { message?: string }
            console.error('[Vote] Blockchain error:', err.message)
            return NextResponse.json(
                { error: `Blockchain vote failed: ${err.message || 'Unknown error'}` },
                { status: 500 }
            )
        }

        // Record vote in MongoDB
        regRequest.votes.push({
            voter: voterLower,
            approve,
            txHash: voteResult.txHash,
            timestamp: new Date(),
        })

        // If resolved on-chain, update status and create accounts
        if (voteResult.resolved) {
            regRequest.status = voteResult.approved ? 'approved' : 'rejected'

            if (voteResult.approved) {
                // Create Lab/Researcher and User records
                const roleId = regRequest.role === 'LAB'
                    ? `LAB-${crypto.randomBytes(4).toString('hex')}`
                    : `RES-${crypto.randomBytes(4).toString('hex')}`

                if (regRequest.role === 'LAB') {
                    await Lab.create({
                        labId: roleId,
                        name: regRequest.name,
                        email: regRequest.email,
                        walletAddress: regRequest.applicantAddress,
                        verificationStatus: true,
                    })
                } else {
                    await Researcher.create({
                        researcherId: roleId,
                        name: regRequest.name,
                        institution: regRequest.institution,
                        email: regRequest.email,
                        walletAddress: regRequest.applicantAddress,
                        verificationStatus: true,
                    })
                }

                await User.create({
                    email: regRequest.email,
                    password: regRequest.password, // Already hashed
                    role: regRequest.role,
                    walletAddress: regRequest.applicantAddress,
                    isAdmin: true,
                    displayName: regRequest.name,
                    labId: regRequest.role === 'LAB' ? roleId : undefined,
                    researcherId: regRequest.role === 'RESEARCHER' ? roleId : undefined,
                })
            }
        }

        await regRequest.save()

        return NextResponse.json({
            success: true,
            txHash: voteResult.txHash,
            resolved: voteResult.resolved,
            approved: voteResult.approved,
            currentVotes: {
                approve: regRequest.votes.filter((v: { approve: boolean }) => v.approve).length,
                reject: regRequest.votes.filter((v: { approve: boolean }) => !v.approve).length,
            },
            status: regRequest.status,
            message: voteResult.resolved
                ? `Registration ${voteResult.approved ? 'approved' : 'rejected'} by majority vote.`
                : 'Vote recorded. Waiting for more votes.',
        })

    } catch (error: unknown) {
        const err = error as { message?: string }
        console.error('[Vote] Error:', err.message || error)
        return NextResponse.json(
            { error: `Vote failed: ${err.message || 'Unknown error'}` },
            { status: 500 }
        )
    }
}
