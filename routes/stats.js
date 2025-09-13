const express = require("express");
const mongoose = require("mongoose");
const router = express.Router({ mergeParams: true });
const DailyCount = require("../models/dailyCount");
const MonthlyCount = require("../models/monthlyCount");
const RdwEntry = require("../models/rdwEntry");
const DailyDifference = require("../models/dailyDifference");

const DailyCountIS300H = require("../models/dailyCountIS300H");
const MonthlyCountIS300H = require("../models/monthlyCountIS300H");
const RdwEntryIS300H = require("../models/rdwEntryIS300H");
const DailyDifferenceIS300H = require("../models/dailyDifferenceIS300H");

const isMongoConnected = () => {
  return mongoose.connection.readyState === 1;
};

const getModelsForCar = (car) => {
    const key = (car || "").toUpperCase();
    if (key === "IS300H") {
        return {
            DailyCount: DailyCountIS300H,
            MonthlyCount: MonthlyCountIS300H,
            RdwEntry: RdwEntryIS300H,
            DailyDifference: DailyDifferenceIS300H,
        };
    }
    if (key === "IS250C") {
        return {
            DailyCount,
            MonthlyCount,
            RdwEntry,
            DailyDifference,
        };
    }
    return null;
};

router.use((req, res, next) => {
    const models = getModelsForCar(req.params.car);
    if (!models) {
        return res.status(400).json({
            error: "Unsupported car segment. Use IS250C or IS300H.",
        });
    }
    req.models = models;
    next();
});

router.get("/daily-count", async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({ error: "Database not connected" });
    }
    const data = await req.models.DailyCount.find().sort({ date: 1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch daily stats" });
  }
});

router.get("/monthly-count", async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({ error: "Database not connected" });
    }
    const data = await req.models.MonthlyCount.find().sort({ month: 1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch monthly stats" });
  }
});

router.get("/rdw-data", async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({ error: "Database not connected" });
    }

    res.set({
      "Cache-Control": "public, max-age=3600",
      ETag: `"rdw-${Date.now()}"`,
    });

    const { search = "", sortBy = "kenteken", sortOrder = "asc" } = req.query;

    let searchQuery = {};
    if (search) {
      searchQuery = {
        $or: [
          { kenteken: { $regex: search, $options: "i" } },
          { merk: { $regex: search, $options: "i" } },
          { handelsbenaming: { $regex: search, $options: "i" } },
          { eerste_kleur: { $regex: search, $options: "i" } },
          { inrichting: { $regex: search, $options: "i" } },
        ],
      };
    }

    const sortObject = {};
    sortObject[sortBy] = sortOrder === "desc" ? -1 : 1;

    const data = await req.models.RdwEntry.find(searchQuery)
      .sort(sortObject)
      .lean();

    const lastUpdate = await req.models.RdwEntry.findOne()
      .sort({ lastUpdated: -1 })
      .select("lastUpdated");

    res.json({
      data,
      lastUpdated: lastUpdate?.lastUpdated || null,
      count: data.length,
    });
  } catch (err) {
    console.error("Error fetching RDW data:", err);
    res.status(500).json({ error: "Failed to fetch RDW data" });
  }
});

router.get("/rdw-data/:kenteken", async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({ error: "Database not connected" });
    }

    const { kenteken } = req.params;

    res.set({
      "Cache-Control": "public, max-age=3600",
    });

    const entry = await req.models.RdwEntry.findOne({
      kenteken: kenteken.toUpperCase(),
    });

    if (!entry) {
      return res.status(404).json({ error: "Vehicle not found" });
    }

    res.json(entry);
  } catch (err) {
    console.error("Error fetching RDW entry:", err);
    res.status(500).json({ error: "Failed to fetch vehicle data" });
  }
});

router.get("/rdw-stats", async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({ error: "Database not connected" });
    }

    res.set({
      "Cache-Control": "public, max-age=1800",
    });

    const totalCount = await req.models.RdwEntry.countDocuments();
    const lastUpdate = await req.models.RdwEntry.findOne()
      .sort({ lastUpdated: -1 })
      .select("lastUpdated");

    const colorStats = await req.models.RdwEntry.aggregate([
      { $group: { _id: "$eerste_kleur", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const yearStats = await req.models.RdwEntry.aggregate([
      {
        $addFields: {
          year: {
            $substr: ["$datum_eerste_toelating", 0, 4],
          },
        },
      },
      { $group: { _id: "$year", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const inrichtingStats = await req.models.RdwEntry.aggregate([
      { $group: { _id: "$inrichting", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({
      totalCount,
      lastUpdated: lastUpdate?.lastUpdated || null,
      statistics: {
        colorDistribution: colorStats,
        yearDistribution: yearStats,
        bodyTypeDistribution: inrichtingStats,
      },
    });
  } catch (err) {
    console.error("Error fetching RDW statistics:", err);
    res.status(500).json({ error: "Failed to fetch RDW statistics" });
  }
});

router.get("/daily-differences", async (req, res) => {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({ error: "Database not connected" });
    }

    res.set({
      "Cache-Control": "public, max-age=1800",
    });

    const { date, limit = 30 } = req.query;

    let query = {};
    if (date) {
      query.date = date;
    }

    const data = await req.models.DailyDifference.find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .lean();

    const transformedData = data.map((entry) => ({
      date: entry.date,
      changes:
        entry.totalChanges > 0
          ? {
              added: entry.added,
              removed: entry.removed,
            }
          : [],
      totalChanges: entry.totalChanges,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    }));

    res.json({
      data: transformedData,
      count: data.length,
    });
  } catch (err) {
    console.error("Error fetching daily differences:", err);
    res.status(500).json({ error: "Failed to fetch daily differences" });
  }
});

module.exports = router;
