const mongoose = require('mongoose');

// Caches a Places API search for 24 h to avoid re-billing the same query
const searchCacheSchema = new mongoose.Schema({
  cacheKey: { type: String, required: true, unique: true },
  query:    String,
  location: String,
  radius:   Number,
  category: String,
  placeIds: [String],
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
  },
}, { timestamps: true });

searchCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // MongoDB TTL

module.exports = mongoose.model('SearchCache', searchCacheSchema);
