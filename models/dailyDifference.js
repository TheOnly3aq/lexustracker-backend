const mongoose = require("mongoose");

const DailyDifferenceSchema = new mongoose.Schema(
  {
    date: { 
      type: String, 
      required: true, 
      unique: true 
    },
    added: [{ 
      type: String 
    }], 
    removed: [{ 
      type: String 
    }], 
    totalChanges: { 
      type: Number, 
      default: 0 
    }, 
  },
  {
    timestamps: true,
  }
);

DailyDifferenceSchema.index({ date: -1 });

module.exports = mongoose.model("DailyDifference", DailyDifferenceSchema);