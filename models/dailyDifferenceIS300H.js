const mongoose = require("mongoose");

const DailyDifferenceIS300HSchema = new mongoose.Schema(
  {
    date: { type: String, required: true, unique: true },
    added: [{ type: String }],
    removed: [{ type: String }],
    totalChanges: { type: Number, default: 0 },
  },
  { timestamps: true }
);

DailyDifferenceIS300HSchema.index({ date: -1 });

module.exports = mongoose.model(
  "DailyDifferenceIS300H",
  DailyDifferenceIS300HSchema,
  "dailydifferences_is300h"
);