const mongoose = require("mongoose");

const RdwEntrySchema = new mongoose.Schema({
  kenteken: String,
  merk: String,
  datum_eerste_toelating: Date,
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("RdwEntry", RdwEntrySchema);
