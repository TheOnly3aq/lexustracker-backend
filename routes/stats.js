const express = require("express");
const router = express.Router();
const DailyCount = require("../models/dailyCount");
const MonthlyCount = require("../models/monthlyCount");

router.get("/daily-count", async (req, res) => {
  try {
    const data = await DailyCount.find().sort({ date: 1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch daily stats" });
  }
});

router.get("/monthly-count", async (req, res) => {
  try {
    const data = await MonthlyCount.find().sort({ month: 1 }); 
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch monthly stats" });
  }
});

module.exports = router;
