const Lead = require('../models/Lead');
const { analyzeWebsite } = require('../services/analyzer.service');
const { computeLeadScore } = require('../services/scoring.service');
const { generatePitchPlaybook } = require('../services/pitch.service');
const { externalApiQueue } = require('../middleware/rateLimit');

const LANGS = ['hinglish', 'hindi', 'english'];

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

    // Pitch playbook from the finished audit. A failure here never loses the audit itself.
    if (!analysis.error) {
      const language = LANGS.includes(req.body?.language) ? req.body.language : (lead.pitchPlaybook?.language || 'hinglish');
      try {
        lead.pitchPlaybook = await externalApiQueue(() => generatePitchPlaybook({ lead: { ...lead.toObject(), analysis }, language }));
      } catch (e) {
        console.error('[pitch] playbook failed:', e.message);
      }
    }

    await lead.save();
    res.json(lead);
  } catch (e) { next(e); }
}

// Regenerate only the playbook (e.g. in another language) without re-running the audit
async function pitch(req, res, next) {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, userId: req.user._id });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    if (!lead.analysis || lead.analysis.error) return res.status(400).json({ error: 'Run the audit first' });

    const language = LANGS.includes(req.body?.language) ? req.body.language : 'hinglish';
    lead.pitchPlaybook = await externalApiQueue(() => generatePitchPlaybook({ lead: lead.toObject(), language }));
    await lead.save();
    res.json(lead);
  } catch (e) { next(e); }
}

module.exports = { analyze, pitch };
