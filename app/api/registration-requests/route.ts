import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { RegistrationRequest } from '@/lib/models/RegistrationRequest'

export async function GET(request: NextRequest) {
    try {
        await connectDB()

        const { searchParams } = new URL(request.url)
        const role = searchParams.get('role')?.toUpperCase()
        const status = searchParams.get('status') || 'pending'

        const filter: Record<string, unknown> = { status }
        if (role && (role === 'LAB' || role === 'RESEARCHER')) {
            filter.role = role
        }

        const requests = await RegistrationRequest.find(filter)
            .select('-password') // Never expose hashed passwords
            .sort({ createdAt: -1 })
            .lean()

        return NextResponse.json({
            success: true,
            requests,
            count: requests.length,
        })

    } catch (error: unknown) {
        const err = error as { message?: string }
        console.error('[RegistrationRequests] Error:', err.message || error)
        return NextResponse.json(
            { error: `Failed to fetch registration requests: ${err.message || 'Unknown'}` },
            { status: 500 }
        )
    }
}
