import mongoose, { Document, Schema } from 'mongoose'

export interface IAuditEvent extends Document {
    eventId: string
    timestamp: Date
    action: string
    actor: string
    actorRole: 'Patient' | 'Lab' | 'Researcher' | 'System'
    target: string
    txHash: string
    details: string
    createdAt: Date
}

const auditEventSchema = new Schema<IAuditEvent>({
    eventId: {
        type: String,
        required: true,
        unique: true
    },
    timestamp: {
        type: Date,
        required: true
    },
    action: {
        type: String,
        required: true
    },
    actor: {
        type: String,
        required: true
    },
    actorRole: {
        type: String,
        enum: ['Patient', 'Lab', 'Researcher', 'System'],
        required: true
    },
    target: {
        type: String,
        required: true
    },
    txHash: {
        type: String,
        required: true
    },
    details: {
        type: String,
        required: true
    }
}, {
    timestamps: { createdAt: true, updatedAt: false }
})

auditEventSchema.index({ timestamp: -1 })
auditEventSchema.index({ actorRole: 1 })
auditEventSchema.index({ actor: 1 })
auditEventSchema.index({ eventId: 1 })

export const AuditEventModel = mongoose.models.AuditEvent || mongoose.model<IAuditEvent>('AuditEvent', auditEventSchema)
