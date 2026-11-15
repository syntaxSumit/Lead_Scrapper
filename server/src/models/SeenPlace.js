const mongoose = require('mongoose');

const seenPlaceSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  place_id: { type: String, required: true },
  name:     String,
  seenAt:   { type: Date, default: Date.now },
}, { timestamps: true });

// Compound unique index: ensure one record per user per place_id
seenPlaceSchema.index({ userId: 1, place_id: 1 }, { unique: true });

module.exports = mongoose.model('SeenPlace', seenPlaceSchema);
