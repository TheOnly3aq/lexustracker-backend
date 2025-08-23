require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
mongoose.set("bufferCommands", false);

const app = express();
const PORT = process.env.PORT || 3000;


async function connectDB() {
    const cliUriArg = process.argv.find(a => a.startsWith("--uri="));
    const uri = (cliUriArg ? cliUriArg.slice("--uri=".length) : process.env.MONGO_URI) || "mongodb://localhost:27017/lexustracker";
    if (!uri || typeof uri !== "string" || uri.trim() === "") {
        throw new Error("MONGO_URI is missing or empty. Set it in your environment or .env file.");
    }

    try {
        const safeUri = uri.replace(/:\\S+@/, ":****@");
    } catch (_) {
    }

    try {
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            family: 4,
            directConnection: true,
            retryWrites: false,
        });
    } catch (error) {
        if (error?.code === 'ENOTFOUND') {
            console.error("MongoDB connection error: Hostname not found. Use an IP or fix DNS/VPN (or /etc/hosts).", error);
        } else if (/(ECONNREFUSED|NoPrimary|ReplicaSetNoPrimary)/.test(String(error))) {
            console.error("MongoDB connection error: Connection refused or no primary. Is mongod running? Firewall/VPN open? Remove replicaSet param if standalone.", error);
        } else {
            console.error("MongoDB connection error:", error);
        }
        process.exit(1);
    }
}

(async () => {
    await connectDB();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})();