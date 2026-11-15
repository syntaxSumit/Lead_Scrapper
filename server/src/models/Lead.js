const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema({
  overallScore:       Number,
  strengths:          [String],
  weaknesses:         [String],
  designImpression:   String,
  seoIssues:          [String],
  conversionIssues:   [String],
  quickWins:          [String],
  suggestedPitchAngle: String,
  checks: {
    hasHttps:        Boolean,
    hasViewport:     Boolean,
    hasTitle:        Boolean,
    hasMetaDesc:     Boolean,
    hasH1:           Boolean,
    hasContactInfo:  Boolean,
    hasClickToCall:  Boolean,
    hasWhatsApp:     Boolean,
    hasContactForm:  Boolean,
    hasGMapsEmbed:   Boolean,
    hasFavicon:      Boolean,
    imagesHaveAlts:  Boolean,
  },
  pageSpeed: {
    performance:   Number,
    seo:           Number,
    accessibility: Number,
    bestPractices: Number,
  },
  analyzedAt: Date,
}, { _id: false });

const outreachSchema = new mongoose.Schema({
  whatsapp:  String,
  emailSubject: String,
  emailBody:    String,
  callScript:   String,
  language:  { type: String, enum: ['hinglish', 'hindi', 'english'], default: 'hinglish' },
  generatedAt: Date,
}, { _id: false });

// How to pitch this business, generated from the audit
const pitchPlaybookSchema = new mongoose.Schema({
  agencyName:       String,
  agencyOffer:      String,
  callerIntro:      String,
  summary:          String,
  temperature:      String,
  decisionMaker:    String,
  bestChannel:      String,
  bestTime:         String,
  openingHook:      String,
  talkingPoints:    [{ _id: false, issue: String, impact: String, solution: String, proofLine: String }],
  valueProposition: String,
  objections:       [{ _id: false, objection: String, response: String }],
  closingAsk:       String,
  followUps:        [{ _id: false, day: Number, channel: String, message: String }],
  avoid:            [String],
  firstMessage:     String,
  language:  { type: String, enum: ['hinglish', 'hindi', 'english'], default: 'hinglish' },
  generatedAt: Date,
}, { _id: false });

const leadSchema = new mongoose.Schema({
  place_id:    { type: String, required: true },
  name:        { type: String, required: true },
  category:    String,
  address:     String,
  phone:       String,
  rating:      Number,
  reviewCount: Number,
  mapsUrl:     String,
  websiteUrl:  String,
  websiteStatus: {
    type: String,
    enum: ['NO_WEBSITE', 'SOCIAL_ONLY', 'HAS_WEBSITE', 'BROKEN', 'UNCHECKED'],
    default: 'UNCHECKED',
  },
  leadScore:  { type: Number, default: 0 },
  scoreLabel: { type: String, enum: ['HOT', 'WARM', 'COLD'], default: 'COLD' },
  analysis:   analysisSchema,
  pipelineStatus: {
    type: String,
    enum: ['NEW', 'CONTACTED', 'REPLIED', 'MEETING', 'WON', 'LOST'],
    default: 'NEW',
  },
  notes:       String,
  followUpDate: Date,
  outreach:    outreachSchema,
  pitchPlaybook: pitchPlaybookSchema,
  lat:         Number,
  lng:         Number,
  openingHours: [String],
  searchQuery: String,
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
}, { timestamps: true });

leadSchema.index({ leadScore: -1 });
leadSchema.index({ websiteStatus: 1 });
leadSchema.index({ pipelineStatus: 1 });
leadSchema.index({ userId: 1, createdAt: -1 });
// CRIT-03: compound unique index — same place can be saved by different users
leadSchema.index({ place_id: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Lead', leadSchema);
