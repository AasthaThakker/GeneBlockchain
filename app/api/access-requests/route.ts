import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { AccessRequestModel } from '@/lib/models/AccessRequestModel'
import { AuditEventModel } from '@/lib/models/AuditEvent'
import { logAccessOnChain, isBlockchainAvailable } from '@/lib/blockchain'

export async function GET(request: NextRequest) {
    try {
        await connectDB()

        const { searchParams } = new URL(request.url)
        const pid = searchParams.get('pid')
        const researcherId = searchParams.get('researcherId')

        const query: Record<string, string> = {}
        if (pid) query.pid = pid
        if (researcherId) query.researcherId = researcherId

        const requests = await AccessRequestModel.find(query).sort({ requestedAt: -1 }).lean()

        return NextResponse.json({ success: true, data: requests })
    } catch (error) {
        console.error('Get access requests error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        await connectDB()

        const body = await request.json()
        const { pid, researcherId, researcherName, institution, genomicRecordId, purpose, durationDays } = body

        if (!pid || !researcherId || !researcherName || !institution || !genomicRecordId || !purpose || !durationDays) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const count = await AccessRequestModel.countDocuments()
        const requestId = `AR-${String(count + 1).padStart(3, '0')}`
        const blockchainRequestId = `0xREQ${String(count + 1).padStart(3, '0')}`

        const accessRequest = new AccessRequestModel({
            requestId,
            pid,
            researcherId,
            researcherName,
            institution,
            genomicRecordId,
            purpose,
            durationDays,
            status: 'Pending',
            blockchainRequestId,
            requestedAt: new Date()
        })

        await accessRequest.save()

        // Create audit event
        const auditCount = await AuditEventModel.countDocuments()
        await AuditEventModel.create({
            eventId: `AE-${String(auditCount + 1).padStart(3, '0')}`,
            timestamp: new Date(),
            action: 'AccessRequested',
            actor: researcherId,
            actorRole: 'Researcher',
            target: requestId,
            txHash: blockchainRequestId,
            details: `${researcherName} (${institution}) requested access to ${genomicRecordId} for: ${purpose}`
        })

        return NextResponse.json({ success: true, data: accessRequest })
    } catch (error) {
        console.error('Create access request error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function PATCH(request: NextRequest) {
    try {
        await connectDB()

        const body = await request.json()
        const { requestId, status, researcherWallet, onChainRecordIndex, onChainConsentIndex } = body

        if (!requestId || !status || !['Approved', 'Rejected'].includes(status)) {
            return NextResponse.json({ error: 'requestId and valid status required' }, { status: 400 })
        }

        // If approving, log access on blockchain
        let accessTxHash = ''
        if (status === 'Approved') {
            const chainAvailable = await isBlockchainAvailable()
            const existing = await AccessRequestModel.findOne({ requestId }).lean() as Record<string, unknown> | null

            if (chainAvailable && existing && researcherWallet) {
                const recordIdx = onChainRecordIndex ?? 0
                const consentIdx = onChainConsentIndex ?? 0
                const pid = existing.pid as string

                const result = await logAccessOnChain(pid, researcherWallet, recordIdx, consentIdx)
                accessTxHash = result.txHash

                if (result.accessGranted) {
                    console.log(`[Blockchain] Access granted: txHash=${accessTxHash}`)
                } else {
                    console.warn(`[Blockchain] Access denied on-chain: txHash=${accessTxHash}`)
                }
            } else {
                accessTxHash = `0xACCESS_${Date.now().toString(16)}`
            }

            // Create audit event for approval
            const auditCount = await AuditEventModel.countDocuments()
            await AuditEventModel.create({
                eventId: `AE-${String(auditCount + 1).padStart(3, '0')}`,
                timestamp: new Date(),
                action: 'AccessApproved',
                actor: existing?.pid as string || 'unknown',
                actorRole: 'Patient',
                target: requestId,
                txHash: accessTxHash,
                details: `Access request ${requestId} approved`
            })
        }

        const updated = await AccessRequestModel.findOneAndUpdate(
            { requestId },
            { status, ...(accessTxHash ? { accessTxHash } : {}) },
            { new: true }
        ).lean()

        if (!updated) {
            return NextResponse.json({ error: 'Request not found' }, { status: 404 })
        }

        return NextResponse.json({ success: true, data: updated })
    } catch (error) {
        console.error('Update access request error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
