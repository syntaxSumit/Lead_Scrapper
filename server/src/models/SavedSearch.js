const mongoose = require('mongoose');

const savedSearchSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  query:    String,
  location: String,
  radius:   Number,
  limit:    Number,
  category: String,
  filters:  Object,
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
}, { timestamps: true });

module.exports = mongoose.model('SavedSearch', savedSearchSchema);
