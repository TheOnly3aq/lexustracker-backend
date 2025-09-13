const axios = require("axios");
const cron = require("node-cron");
const mongoose = require("mongoose");
const DailyCount = require("../models/dailyCount");
const MonthlyCount = require("../models/monthlyCount");
const RdwEntry = require("../models/rdwEntry");
const DailyDifference = require("../models/dailyDifference");

// Ensure MongoDB connection before any operations
const ensureMongoConnection = async () => {
  if (mongoose.connection.readyState === 1) return;

  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/lexustracker"
    );
    console.log("MongoDB connected for IS250C job");
  } catch (err) {
    console.error("Failed to connect to MongoDB for IS250C job:", err);
    throw err;
  }
};

const fetchRdwData = async () => {
  try {
    await ensureMongoConnection();
    console.log("Starting RDW data fetch...");

    const existingKentekenList = await RdwEntry.distinct("kenteken");

    const response = await axios.get(
      "https://opendata.rdw.nl/resource/m9d7-ebf2.json?$where=contains(handelsbenaming,'IS250C')&$limit=1000"
    );

    const entries = response.data;
    console.log(`(IS250H) Fetched ${entries.length} entries from RDW API`);

    const now = new Date();
    const dateString = now.toISOString().split("T")[0];
    const yearMonth = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;

    await DailyCount.findOneAndUpdate(
      { date: dateString },
      { $set: { count: entries.length } },
      { upsert: true, new: true }
    );

    await MonthlyCount.findOneAndUpdate(
      { month: yearMonth },
      { $set: { count: entries.length } },
      { upsert: true, new: true }
    );

    let updatedCount = 0;
    let newCount = 0;
    const addedKentekens = [];

    for (const entry of entries) {
      try {
        const existingEntry = await RdwEntry.findOne({
          kenteken: entry.kenteken,
        });

        if (existingEntry) {
          await RdwEntry.findOneAndUpdate(
            { kenteken: entry.kenteken },
            {
              ...entry,
              lastUpdated: new Date(),
            }
          );
          updatedCount++;
        } else {
          await RdwEntry.create({
            ...entry,
            lastUpdated: new Date(),
          });
          newCount++;
          addedKentekens.push(entry.kenteken);
        }
      } catch (entryError) {
        console.warn(
          `(IS250H) Skipped entry ${entry.kenteken}:`,
          entryError.message
        );
      }
    }

    console.log(
      `(IS250H) Saved RDW count for ${dateString}: ${entries.length}`
    );
    console.log(`(IS250H) Saved RDW count for ${yearMonth}: ${entries.length}`);
    console.log(
      `(IS250H) Cached data: ${newCount} new entries, ${updatedCount} updated entries`
    );

    const currentKentekenList = entries.map((entry) => entry.kenteken);

    const removedKentekens = existingKentekenList.filter(
      (kenteken) => !currentKentekenList.includes(kenteken)
    );

    const deleteResult = await RdwEntry.deleteMany({
      kenteken: { $nin: currentKentekenList },
    });

    if (deleteResult.deletedCount > 0) {
      console.log(
        `(IS250H) Removed ${deleteResult.deletedCount} entries that are no longer in the API`
      );
    }

    const totalChanges = addedKentekens.length + removedKentekens.length;

    if (totalChanges > 0) {
      await DailyDifference.findOneAndUpdate(
        { date: dateString },
        {
          $set: {
            added: addedKentekens,
            removed: removedKentekens,
            totalChanges: totalChanges,
          },
        },
        { upsert: true, new: true }
      );

      console.log(
        `(IS250H) Daily differences for ${dateString}: ${addedKentekens.length} added, ${removedKentekens.length} removed`
      );
    } else {
      await DailyDifference.findOneAndUpdate(
        { date: dateString },
        {
          $set: {
            added: [],
            removed: [],
            totalChanges: 0,
          },
        },
        { upsert: true, new: true }
      );

      console.log(`(IS250H) No changes detected for ${dateString}`);
    }
  } catch (err) {
    console.error("(IS250H) Error fetching RDW data:", err.message);
  }
};

module.exports = { fetchRdwData };

// Schedule cron job only after MongoDB connection is established
ensureMongoConnection()
  .then(() => {
    console.log("Scheduling IS250C cron job...");
    cron.schedule("0 0 * * *", fetchRdwData);
  })
  .catch((err) => {
    console.error(
      "Failed to establish MongoDB connection for IS250C cron job:",
      err
    );
  });
