const mongoose = require('mongoose');
require('dotenv').config();

// Rough schemas for migration
const UserSchema = new mongoose.Schema({ walletAddress: String, pid: String });
const ConsentSchema = new mongoose.Schema({ pid: String });
const GenomicRecordSchema = new mongoose.Schema({ pid: String });
const AccessRequestSchema = new mongoose.Schema({ pid: String });

async function syncPids() {
    try {
        await mongoose.connect(process.env.DATABASE_URL);
        console.log("Connected to MongoDB.");

        const User = mongoose.models.User || mongoose.model('User', UserSchema);
        const Consent = mongoose.models.Consent || mongoose.model('Consent', ConsentSchema);
        const GenomicRecord = mongoose.models.GenomicRecord || mongoose.model('GenomicRecord', GenomicRecordSchema);
        const AccessRequest = mongoose.models.AccessRequest || mongoose.model('AccessRequest', AccessRequestSchema);

        const oldPid = "PID-742d35";
        const newAddress = "0x8ce919758740a8F400873C58c424acbC0349eeaa".toLowerCase();
        const newPid = "PID-" + newAddress.slice(2, 8);

        console.log(`\nSyncing data from ${oldPid} to ${newPid} (${newAddress})`);

        // 1. Update User PID if exists
        const userUpdate = await User.updateOne({ walletAddress: newAddress }, { $set: { pid: newPid } });
        console.log(`Updated User PID: ${userUpdate.modifiedCount}`);

        // 2. Update Consents
        const consentUpdate = await Consent.updateMany({ pid: oldPid }, { $set: { pid: newPid } });
        console.log(`Updated Consents: ${consentUpdate.modifiedCount}`);

        // 3. Update Genomic Records
        const recordUpdate = await GenomicRecord.updateMany({ pid: oldPid }, { $set: { pid: newPid } });
        console.log(`Updated Genomic Records: ${recordUpdate.modifiedCount}`);

        // 4. Update Access Requests
        const requestUpdate = await AccessRequest.updateMany({ pid: oldPid }, { $set: { pid: newPid } });
        console.log(`Updated Access Requests: ${requestUpdate.modifiedCount}`);

        // Update PID-001 case
        await User.updateOne({ pid: "PID-001" }, { $set: { pid: newPid } });

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await mongoose.connection.close();
    }
}

syncPids();
