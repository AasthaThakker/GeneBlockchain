import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { ConsentModel } from '@/lib/models/ConsentModel'
import { AuditEventModel } from '@/lib/models/AuditEvent'
import { grantConsent, revokeConsentOnChain, isBlockchainAvailable } from '@/lib/blockchain'

export async function GET(request: NextRequest) {
    try {
        await connectDB()

        const { searchParams } = new URL(request.url)
        const pid = searchParams.get('pid')
        const researcherId = searchParams.get('researcherId')

        const query: Record<string, string> = {}
        if (pid) query.pid = pid
        if (researcherId) query.researcherId = researcherId

        const consents = await ConsentModel.find(query).sort({ consentStart: -1 }).lean()

        return NextResponse.json({ success: true, data: consents })
    } catch (error) {
        console.error('Get consents error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        await connectDB()

        const body = await request.json()
        const { pid, researcherId, researcherName, institution, genomicRecordId, researcherWallet, onChainRecordIndex, consentStart, consentEnd } = body

        if (!pid || !researcherId || !researcherName || !institution || !genomicRecordId || !consentStart || !consentEnd) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Calculate duration in days
        const start = new Date(consentStart)
        const end = new Date(consentEnd)
        const durationDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))

        // Grant consent on blockchain
        let blockchainTxHash = ''
        let onChainConsentIndex = -1
        const chainAvailable = await isBlockchainAvailable()

        if (chainAvailable) {
            // Use researcher wallet or a default address for on-chain consent
            const researcherAddr = researcherWallet || '0x90F79bf6EB2c4f870365E785982E1f101E93b906'
            const recordIdx = onChainRecordIndex ?? 0

            const result = await grantConsent(pid, researcherAddr, recordIdx, durationDays)
            blockchainTxHash = result.txHash
            onChainConsentIndex = result.consentIndex
            console.log(`[Blockchain] Consent granted: txHash=${blockchainTxHash}, consentIndex=${onChainConsentIndex}`)
        } else {
            blockchainTxHash = `0xOFFLINE_${Date.now().toString(16)}`
            console.warn('[Blockchain] Node unavailable — using offline txHash')
        }

        const count = await ConsentModel.countDocuments()
        const consentId = `CON-${String(count + 1).padStart(3, '0')}`

        const consent = new ConsentModel({
            consentId,
            pid,
            researcherId,
            researcherName,
            institution,
            genomicRecordId,
            consentStart: start,
            consentEnd: end,
            status: 'Active',
            blockchainTxHash,
            onChainConsentIndex
        })

        await consent.save()

        // Create audit event
        const auditCount = await AuditEventModel.countDocuments()
        await AuditEventModel.create({
            eventId: `AE-${String(auditCount + 1).padStart(3, '0')}`,
            timestamp: new Date(),
            action: 'ConsentGranted',
            actor: pid,
            actorRole: 'Patient',
            target: consentId,
            txHash: blockchainTxHash,
            details: `Patient ${pid} granted ${durationDays}-day consent to ${researcherName} for ${genomicRecordId}`
        })

        return NextResponse.json({ success: true, data: consent })
    } catch (error) {
        console.error('Create consent error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function PATCH(request: NextRequest) {
    try {
        await connectDB()

        const body = await request.json()
        const { consentId, status } = body

        if (!consentId || !status || !['Revoked'].includes(status)) {
            return NextResponse.json({ error: 'consentId and status "Revoked" required' }, { status: 400 })
        }

        // Find the consent to get on-chain index
        const existing = await ConsentModel.findOne({ consentId }).lean() as Record<string, unknown> | null
        if (!existing) {
            return NextResponse.json({ error: 'Consent not found' }, { status: 404 })
        }

        // Revoke on blockchain
        let revokeTxHash = ''
        const chainAvailable = await isBlockchainAvailable()
        const onChainIdx = (existing as Record<string, unknown>).onChainConsentIndex as number | undefined

        if (chainAvailable && onChainIdx !== undefined && onChainIdx >= 0) {
            const result = await revokeConsentOnChain(onChainIdx)
            revokeTxHash = result.txHash
            console.log(`[Blockchain] Consent revoked: txHash=${revokeTxHash}`)
        } else {
            revokeTxHash = `0xREVOKE_OFFLINE_${Date.now().toString(16)}`
        }

        const updated = await ConsentModel.findOneAndUpdate(
            { consentId },
            { status, revokeTxHash },
            { new: true }
        ).lean()

        // Create audit event
        const auditCount = await AuditEventModel.countDocuments()
        await AuditEventModel.create({
            eventId: `AE-${String(auditCount + 1).padStart(3, '0')}`,
            timestamp: new Date(),
            action: 'ConsentRevoked',
            actor: (existing as Record<string, unknown>).pid as string,
            actorRole: 'Patient',
            target: consentId,
            txHash: revokeTxHash,
            details: `Patient revoked consent ${consentId}`
        })

        return NextResponse.json({ success: true, data: updated })
    } catch (error) {
        console.error('Update consent error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
