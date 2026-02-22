import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { AuditEventModel } from '@/lib/models/AuditEvent'

export async function GET(request: NextRequest) {
    try {
        await connectDB()

        const { searchParams } = new URL(request.url)
        const actorRole = searchParams.get('actorRole')
        const actor = searchParams.get('actor')
        const pid = searchParams.get('pid')

        const query: Record<string, unknown> = {}
        if (actorRole) query.actorRole = actorRole
        if (actor) query.actor = actor
        // For patient audit: find events where actor matches pid or target contains pid
        if (pid) {
            query.$or = [
                { actor: pid },
                { target: { $regex: pid, $options: 'i' } },
                { details: { $regex: pid, $options: 'i' } }
            ]
            delete query.actor
        }

        const events = await AuditEventModel.find(query).sort({ timestamp: -1 }).lean()

        return NextResponse.json({ success: true, data: events })
    } catch (error) {
        console.error('Get audit events error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
