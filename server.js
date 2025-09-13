require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const checkApiKey = require("./apiKeyMiddleware");
const statsRoute = require("./routes/stats");
require("./jobs/fetchRdw");
require("./jobs/fetchRdwIS300H");

// Set mongoose options
mongoose.set("bufferCommands", false);

const swaggerDocument = require("./swagger.json");


const app = express();
const PORT = process.env.PORT || 5050;
app.use(cors());
app.use(express.json());
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/robots.txt', function (req, res) {
    res.type('text/plain');
    res.send(
        `User-agent: *
Disallow: /`
    );
});

app.get("/swagger.json", (req, res) => {
    res.json(swaggerDocument);
});

const mongoOptions = {
  serverSelectionTimeoutMS: 10000, // Reduced timeout for faster failure detection
  socketTimeoutMS: 45000, // Reduced socket timeout
  bufferCommands: false,
  retryWrites: true,
  retryReads: true,
};

// Function to attempt MongoDB connection with retries
async function connectToMongoDB() {
  const mongoUri =
    process.env.MONGO_URI || "mongodb://localhost:27017/lexustracker";

  console.log(`Attempting to connect to MongoDB...`);
  console.log(
    `Connection string: ${mongoUri.replace(/\/\/.*@/, "//***:***@")}`
  ); // Hide credentials in logs

  try {
    await mongoose.connect(mongoUri, mongoOptions);
    console.log("✅ MongoDB connected successfully");
    return true;
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);

    // If it's a network/server error, try localhost as fallback
    if (
      error.name === "MongooseServerSelectionError" &&
      mongoUri !== "mongodb://localhost:27017/lexustracker"
    ) {
      console.log("🔄 Attempting fallback to local MongoDB...");
      try {
        await mongoose.connect(
          "mongodb://localhost:27017/lexustracker",
          mongoOptions
        );
        console.log("✅ Connected to local MongoDB successfully");
        return true;
      } catch (fallbackError) {
        console.error(
          "❌ Local MongoDB connection also failed:",
          fallbackError.message
        );
      }
    }

    return false;
  }
}

// Connect to MongoDB and start server
connectToMongoDB().then((connected) => {
  if (connected) {
    app.use("/api/:car/stats", checkApiKey, statsRoute);

    const server = app.listen(PORT, () =>
      console.log(`🚀 Server running on port ${PORT}`)
    );

    // Graceful shutdown handling
    process.on("SIGTERM", () => {
      console.log("🛑 SIGTERM received, shutting down gracefully...");
      server.close(() => {
        console.log("✅ Server closed");
        mongoose.connection.close(false, () => {
          console.log("✅ MongoDB connection closed");
          process.exit(0);
        });
      });
    });

    process.on("SIGINT", () => {
      console.log("🛑 SIGINT received, shutting down gracefully...");
      server.close(() => {
        console.log("✅ Server closed");
        mongoose.connection.close(false, () => {
          console.log("✅ MongoDB connection closed");
          process.exit(0);
        });
      });
    });

    // Monitor MongoDB connection
    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️  MongoDB disconnected");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("✅ MongoDB reconnected");
    });
  } else {
    console.error("💥 Failed to connect to any MongoDB instance. Exiting...");
    process.exit(1);
  }
});
