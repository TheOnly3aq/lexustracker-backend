const mongoose = require("mongoose");

const DailyCountSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true }, // '2025-05-24'
  count: { type: Number, required: true },
});

module.exports = mongoose.model("DailyCount", DailyCountSchema);
