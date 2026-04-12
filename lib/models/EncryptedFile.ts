import mongoose from 'mongoose';

interface IEncryptedFile {
    fileId: string;
    fileName: string;
    fileType: string;
    encryptedData: Buffer;
    iv: Buffer;
    fileHash: string; // SHA-256 hash of original file
    pid: string; // Patient ID
    labId: string;
    labName: string;
    uploadDate: Date;
    blockchainTxHash?: string;
    onChainRecordIndex?: number;
    status: 'Uploaded' | 'Registered' | 'Verified';
    tags: string[];
    fileSize: number;
    // Patient demographic information
    patientAge?: number;
    patientGender?: 'Male' | 'Female' | 'Other';
    geographicRegion?: string;
}

const encryptedFileSchema = new mongoose.Schema<IEncryptedFile>({
    fileId: { type: String, required: true, unique: true },
    fileName: { type: String, required: true },
    fileType: { type: String, required: true },
    encryptedData: { type: Buffer, required: true },
    iv: { type: Buffer, required: true },
    fileHash: { type: String, required: true },
    pid: { type: String, required: true },
    labId: { type: String, required: true },
    labName: { type: String, required: true },
    uploadDate: { type: Date, default: Date.now },
    blockchainTxHash: { type: String },
    onChainRecordIndex: { type: Number },
    status: { 
        type: String, 
        enum: ['Uploaded', 'Registered', 'Verified'], 
        default: 'Uploaded' 
    },
    tags: [{ type: String }],
    fileSize: { type: Number, required: true },
    // Patient demographic information
    patientAge: { type: Number },
    patientGender: { type: String, enum: ['Male', 'Female', 'Other'] },
    geographicRegion: { type: String }
}, {
    timestamps: true
});

// Indexes for better query performance
encryptedFileSchema.index({ fileId: 1 });
encryptedFileSchema.index({ pid: 1 });
encryptedFileSchema.index({ labId: 1 });
encryptedFileSchema.index({ fileHash: 1 });
encryptedFileSchema.index({ uploadDate: -1 });

export const EncryptedFile = mongoose.models.EncryptedFile || 
    mongoose.model<IEncryptedFile>('EncryptedFile', encryptedFileSchema);

export type { IEncryptedFile };
