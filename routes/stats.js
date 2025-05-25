const express = require("express");
const router = express.Router();
const DailyCount = require("../models/dailyCount");

router.get("/daily-count", async (req, res) => {
  try {
    const data = await DailyCount.find().sort({ date: 1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch daily stats" });
  }
});

module.exports = router;
