const axios = require("axios");
const cron = require("node-cron");
const DailyCount = require("../models/dailyCount");
const MonthlyCount = require("../models/monthlyCount");

const fetchRdwData = async () => {
  try {
    const response = await axios.get(
      "https://opendata.rdw.nl/resource/m9d7-ebf2.json?$where=contains(handelsbenaming,'IS250C')"
    );

    const entries = response.data;

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

    console.log(`Saved RDW count for ${dateString}: ${entries.length}`);
    console.log(`Saved RDW count for ${yearMonth}: ${entries.length}`);
  } catch (err) {
    console.error("Error fetching RDW data:", err.message);
  }
};

// fetchRdwData();

cron.schedule("0 0 * * *", fetchRdwData);
