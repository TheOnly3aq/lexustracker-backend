const mongoose = require("mongoose");

const MonthlyCountSchema = new mongoose.Schema({
  month: { type: String, required: true, unique: true },
  count: { type: Number, required: true },
});

module.exports = mongoose.model("MonthlyCount", MonthlyCountSchema);
