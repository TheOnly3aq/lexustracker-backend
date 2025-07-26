require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors"); 
const swaggerUi = require("swagger-ui-express");

const statsRoute = require("./routes/stats");
require("./jobs/fetchRdw");

const swaggerDocument = require("./swagger.json");

const app = express();
const PORT = process.env.PORT || 5050;
app.use(cors());
app.use(express.json());

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get("/swagger.json", (req, res) => {
  res.json(swaggerDocument);
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));


app.use("/api/stats", statsRoute);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
