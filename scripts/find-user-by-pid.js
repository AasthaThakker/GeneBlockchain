const mongoose = require('mongoose');
require('dotenv').config();

const UserSchema = new mongoose.Schema({
    walletAddress: String,
    pid: String,
    role: String
});

async function findUser() {
    try {
        await mongoose.connect(process.env.DATABASE_URL);
        console.log("Connected to MongoDB.");

        const User = mongoose.models.User || mongoose.model('User', UserSchema);

        const targetPid = "PID-742d35";
        console.log(`\nSearching for user with PID: ${targetPid}`);

        const user = await User.findOne({ pid: targetPid });
        if (user) {
            console.log(`FOUND User: Wallet=${user.walletAddress}, Role=${user.role}, PID=${user.pid}`);
        } else {
            console.log("No user found with this PID.");

            console.log("\nListing all users with a PID:");
            const allWithPid = await User.find({ pid: { $exists: true, $ne: null } });
            allWithPid.forEach(u => console.log(`- Wallet: ${u.walletAddress}, PID: ${u.pid}`));
        }

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await mongoose.connection.close();
    }
}

findUser();
