require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const checkApiKey = require("./apiKeyMiddleware");
const statsRoute = require("./routes/stats");
require("./jobs/fetchRdw");
require("./jobs/fetchRdwIS300H");

const swaggerDocument = require("./swagger.json");

const app = express();
const PORT = process.env.PORT || 5050;
app.use(cors());
app.use(express.json());
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get("/robots.txt", function (req, res) {
  res.type("text/plain");
  res.send(
    `User-agent: *
Disallow: /`
  );
});

app.get("/swagger.json", (req, res) => {
  res.json(swaggerDocument);
});

const startServer = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/lexustracker"
    );
    console.log("MongoDB connected");

    app.use("/api/:car/stats", checkApiKey, statsRoute);

    app.listen(PORT, () => console.log(`(!) Server running on port ${PORT}`));
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

startServer();
