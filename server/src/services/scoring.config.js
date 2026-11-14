// shortcut: flat config file for weights; add UI panel when multiple users need personalised weights
module.exports = {
  weights: {
    NO_WEBSITE:  50,
    SOCIAL_ONLY: 35,
    BROKEN:      40,
    UNCHECKED:   5,
    HAS_WEBSITE: 10, // baseline; reduced further if site analysis score is high
    highRating:  15, // bonus when rating >= 4.0 AND reviewCount >= 20
    hasPhone:    10,
    categoryBonus: {
      salon:             10,
      clinic:            12,
      hospital:          12,
      restaurant:         8,
      coaching:          10,
      gym:               10,
      'ro service':       8,
      electronics:        8,
      hotel:             10,
      dentist:           12,
      dental:            12,
      lawyer:            10,
      'chartered accountant': 12,
      school:            10,
      caterer:            8,
      bakery:             8,
      spa:               10,
      pharmacy:           8,
      interior:          10,
    },
  },
  thresholds: { HOT: 70, WARM: 40 },
};
