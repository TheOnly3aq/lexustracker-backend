const mongoose = require("mongoose");
const DailyDifference = require("../models/dailyDifference");
const testData = require("../test-daily-differences.json");

// Replace with your MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/lexustracker";

const importTestData = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    await DailyDifference.deleteMany({});
    console.log("Cleared existing daily differences");

    const result = await DailyDifference.insertMany(testData);
    console.log(`Inserted ${result.length} daily difference records`);

    console.log("Test data import completed successfully!");
  } catch (error) {
    console.error("Error importing test data:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

importTestData();