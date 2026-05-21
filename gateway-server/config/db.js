// MongoDB Connection Configuration
const mongoose = require('mongoose');

const connectDB = async () => {
  const MAX_RETRIES = 5;
  const RETRY_DELAY_MS = 2000;
  let retries = 0;

  // Connection Event Listeners
  mongoose.connection.on('connected', () => {
    console.log(`✅ MongoDB Connected (Gateway): ${mongoose.connection.host}`);
  });

  mongoose.connection.on('error', (err) => {
    console.error(`❌ MongoDB Connection Error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn(`⚠️ MongoDB Disconnected. Attempting to reconnect...`);
  });

  mongoose.connection.on('reconnected', () => {
    console.log(`🔄 MongoDB Reconnected.`);
  });

  // Startup Validation with Retry Loop
  while (retries < MAX_RETRIES) {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        maxPoolSize: 50, // Connection pooling for concurrent requests
        serverSelectionTimeoutMS: 5000, // Fail fast and retry
        socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
        family: 4 // Use IPv4, skip trying IPv6
      });
      return; // Exit loop on success
    } catch (error) {
      retries++;
      console.error(`❌ MongoDB Startup Connection Attempt ${retries}/${MAX_RETRIES} Failed: ${error.message}`);
      if (retries >= MAX_RETRIES) {
        console.error('💥 Max connection retries reached. Exiting process.');
        process.exit(1);
      }
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
};

module.exports = connectDB;
