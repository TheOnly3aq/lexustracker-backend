const mongoose = require("mongoose");
const { fetchRdwData } = require("../jobs/fetchRdw");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/lexustracker");
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

const runPopulation = async () => {
  await connectDB();
  
  console.log("Starting initial RDW data population...");
  await fetchRdwData();
  
  console.log("Data population completed!");
  process.exit(0);
};

runPopulation().catch(error => {
  console.error("Error during population:", error);
  process.exit(1);
});