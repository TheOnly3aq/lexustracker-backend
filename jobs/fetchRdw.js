const axios = require("axios");
const cron = require("node-cron");
const DailyCount = require("../models/dailyCount");
const MonthlyCount = require("../models/monthlyCount");
const RdwEntry = require("../models/rdwEntry");

const fetchRdwData = async () => {
  try {
    console.log("Starting RDW data fetch...");

    const response = await axios.get(
      "https://opendata.rdw.nl/resource/m9d7-ebf2.json?$where=contains(handelsbenaming,'IS250C')&$limit=1000"
    );

    const entries = response.data;
    console.log(`Fetched ${entries.length} entries from RDW API`);

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
        }
      } catch (entryError) {
        console.warn(`Skipped entry ${entry.kenteken}:`, entryError.message);
      }
    }

    console.log(`Saved RDW count for ${dateString}: ${entries.length}`);
    console.log(`Saved RDW count for ${yearMonth}: ${entries.length}`);
    console.log(
      `Cached data: ${newCount} new entries, ${updatedCount} updated entries`
    );

    const currentKentekenList = entries.map((entry) => entry.kenteken);
    const deleteResult = await RdwEntry.deleteMany({
      kenteken: { $nin: currentKentekenList },
    });

    if (deleteResult.deletedCount > 0) {
      console.log(
        `Removed ${deleteResult.deletedCount} entries that are no longer in the API`
      );
    }
  } catch (err) {
    console.error("Error fetching RDW data:", err.message);
  }
};

module.exports = { fetchRdwData };

// fetchRdwData();

cron.schedule("0 0 * * *", fetchRdwData);
