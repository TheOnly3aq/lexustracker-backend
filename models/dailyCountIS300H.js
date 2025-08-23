const mongoose = require("mongoose");

const DailyCountIS300HSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true },
  count: { type: Number, required: true },
});

module.exports = mongoose.model("DailyCountIS300H", DailyCountIS300HSchema, "dailycounts_is300h");