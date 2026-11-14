const mongoose = require('mongoose');
const dns = require('dns');

// Fallback to Google DNS to resolve MongoDB Atlas SRV records
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  // Ignore if running in an environment where setServers is restricted
}

async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected');
}

module.exports = { connectDB };
