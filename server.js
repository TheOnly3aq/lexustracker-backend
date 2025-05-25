require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors"); 

const statsRoute = require("./routes/stats");
require("./jobs/fetchRdw");

const app = express();
const PORT = process.env.PORT || 5050;
app.use(cors());
app.use(express.json()); 

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

app.use("/api/stats", statsRoute);


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
