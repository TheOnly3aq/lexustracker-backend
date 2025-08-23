require("dotenv").config();
const mongoose = require("mongoose");
const {fetchRdwDataIS300H} = require("../jobs/fetchRdwIS300H");

mongoose.set("bufferCommands", false);

const connectDB = async () => {
    try {
        const cliUriArg = process.argv.find(a => a.startsWith("--uri="));
        const uri = (cliUriArg ? cliUriArg.slice("--uri=".length) : process.env.MONGO_URI) || "mongodb://localhost:27017/lexustracker";
        if (!uri || typeof uri !== "string" || uri.trim() === "") {
            throw new Error("MONGO_URI is missing or empty. Set it in your environment or .env file.");
        }

        try {
            const safeUri = uri.replace(/:\\S+@/, ":****@");
        } catch (_) {
        }

        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 45000,
            family: 4,
            directConnection: true,
            retryWrites: false
        });
        console.log("Connected to MongoDB");
    } catch (error) {
        if (error?.code === 'ENOTFOUND') {
            console.error("MongoDB connection error: Hostname not found. Check DNS/VPN or use an IP address.", error);
        } else if (/(ECONNREFUSED|NoPrimary|ReplicaSetNoPrimary)/.test(String(error))) {
            console.error("MongoDB connection error: Connection refused or no primary. Is mongod running? Is the firewall/VPN open?", error);
        } else {
            console.error("MongoDB connection error:", error);
        }
        process.exit(1);
    }
};

const runPopulation = async () => {
    await connectDB();

    console.log("Starting initial RDW data population...");
    await fetchRdwDataIS300H();

    console.log("Data population completed!");
    process.exit(0);
};

runPopulation().catch(error => {
    console.error("Error during population:", error);
    process.exit(1);
});
