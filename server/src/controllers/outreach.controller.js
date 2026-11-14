const Lead = require('../models/Lead');
const { generateOutreach } = require('../services/outreach.service');

async function generate(req, res, next) {
  try {
    const { language = 'hinglish' } = req.body;
    // BOLA fix: scope to current user
    const lead = await Lead.findOne({ _id: req.params.id, userId: req.user._id });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const outreach = await generateOutreach({ lead: lead.toObject(), language });
    lead.outreach = outreach;
    await lead.save();

    res.json({ outreach });
  } catch (e) { next(e); }
}

module.exports = { generate };
