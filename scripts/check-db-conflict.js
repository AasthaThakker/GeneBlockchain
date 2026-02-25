const mongoose = require('mongoose');
require('dotenv').config();

// Define Schemas to avoid issues
const UserSchema = new mongoose.Schema({
    walletAddress: String,
    role: String
});

const RegistrationRequestSchema = new mongoose.Schema({
    applicantAddress: String,
    role: String,
    status: String
});

async function checkDatabase() {
    const addressToCheck = "0xdf57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e".toLowerCase();

    try {
        await mongoose.connect(process.env.DATABASE_URL);
        console.log("Connected to MongoDB.");

        const User = mongoose.models.User || mongoose.model('User', UserSchema);
        const RegistrationRequest = mongoose.models.RegistrationRequest || mongoose.model('RegistrationRequest', RegistrationRequestSchema);

        console.log(`\nChecking for address: ${addressToCheck}`);

        const user = await User.findOne({ walletAddress: addressToCheck });
        if (user) {
            console.log(`FOUND User: ID=${user._id}, Role=${user.role}`);
        } else {
            console.log("No User found with this address.");
        }

        const request = await RegistrationRequest.findOne({ applicantAddress: addressToCheck });
        if (request) {
            console.log(`FOUND RegistrationRequest: ID=${request._id}, Status=${request.status}, Role=${request.role}`);
        } else {
            console.log("No RegistrationRequest found with this address.");
        }

    } catch (err) {
        console.error("Database connection error:", err.message);
    } finally {
        await mongoose.connection.close();
    }
}

checkDatabase();
