const Lead = require('../models/Lead');
const { analyzeWebsite } = require('../services/analyzer.service');
const { computeLeadScore } = require('../services/scoring.service');

async function analyze(req, res, next) {
  try {
    // BOLA fix: scope to current user
    const lead = await Lead.findOne({ _id: req.params.id, userId: req.user._id });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const analysis = await analyzeWebsite(lead.toObject());
    lead.analysis = analysis;

    // Re-score now that we have site quality data
    const scores = computeLeadScore({ ...lead.toObject(), analysis });
    lead.leadScore  = scores.leadScore;
    lead.scoreLabel = scores.scoreLabel;

    await lead.save();
    res.json(lead);
  } catch (e) { next(e); }
}

module.exports = { analyze };
