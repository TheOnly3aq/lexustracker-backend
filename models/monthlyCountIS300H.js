const mongoose = require("mongoose");

const MonthlyCountIS300HSchema = new mongoose.Schema({
  month: { type: String, required: true, unique: true },
  count: { type: Number, required: true },
});

module.exports = mongoose.model("MonthlyCountIS300H", MonthlyCountIS300HSchema, "monthlycounts_is300h");