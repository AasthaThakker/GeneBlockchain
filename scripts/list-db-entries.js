const mongoose = require('mongoose');
require('dotenv').config();

const UserSchema = new mongoose.Schema({
    walletAddress: String,
    role: String,
    email: String
});

const RegistrationRequestSchema = new mongoose.Schema({
    applicantAddress: String,
    role: String,
    status: String,
    email: String
});

async function listAll() {
    try {
        await mongoose.connect(process.env.DATABASE_URL);
        console.log("Connected to MongoDB.");

        const User = mongoose.models.User || mongoose.model('User', UserSchema);
        const RegistrationRequest = mongoose.models.RegistrationRequest || mongoose.model('RegistrationRequest', RegistrationRequestSchema);

        console.log("\n--- USERS ---");
        const users = await User.find({}, 'walletAddress role email');
        users.forEach(u => console.log(`- ${u.walletAddress} (${u.role}) [${u.email}]`));

        console.log("\n--- REGISTRATION REQUESTS ---");
        const requests = await RegistrationRequest.find({}, 'applicantAddress role status email');
        requests.forEach(r => console.log(`- ${r.applicantAddress} (${r.role}) [${r.status}] [${r.email}]`));

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await mongoose.connection.close();
    }
}

listAll();
