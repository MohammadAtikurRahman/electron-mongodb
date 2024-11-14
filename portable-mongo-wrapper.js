const path = require("path");
const fs = require("fs");
const log = require("electron-log");

// Import the default async function from portable-mongodb/connection.js
const portableConnect = require("portable-mongodb/connection.js");

async function initializeDatabase(dbName = "DefaultDatabase") {
  try {
    log.info("Starting MongoDB connection process...");

    // Ensure the data directory exists
    const dbPath = path.join(__dirname, "./mongodb-data");
    if (!fs.existsSync(dbPath)) {
      fs.mkdirSync(dbPath, { recursive: true });
      fs.chmodSync(dbPath, 0o777); // Grant full permissions
    }
    log.info("Data Path:", dbPath);

    // Call the default async function
    await portableConnect(dbName);

    log.info(`MongoDB connected successfully to database: ${dbName}`);
    return true;
  } catch (err) {
    log.error("Failed to connect to MongoDB:", err.message);
    throw err;
  }
}

// Export the function
module.exports = { initializeDatabase };
