const Lead = require('../models/Lead');

// Escape special regex characters to prevent regex injection
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function getLeads(req, res, next) {
  try {
    const {
      category, websiteStatus, scoreLabel, pipelineStatus,
      minScore, maxScore, minRating, search,
      sort = '-leadScore', page = 1, limit = 50,
    } = req.query;

    const filter = { userId: req.user._id };
    // HIGH-02: Escape regex inputs to prevent ReDoS / regex injection
    if (category)       filter.category       = new RegExp(escapeRegex(category), 'i');
    if (websiteStatus)  filter.websiteStatus  = websiteStatus;
    if (scoreLabel)     filter.scoreLabel     = scoreLabel;
    if (pipelineStatus) filter.pipelineStatus = pipelineStatus;
    if (search)         filter.name           = new RegExp(escapeRegex(search), 'i');
    if (minRating)      filter.rating         = { $gte: parseFloat(minRating) };
    if (minScore || maxScore) {
      filter.leadScore = {};
      if (minScore) filter.leadScore.$gte = parseInt(minScore, 10);
      if (maxScore) filter.leadScore.$lte = parseInt(maxScore, 10);
    }

    const skip   = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const lim    = Math.min(parseInt(limit, 10), 200);

    const [leads, total] = await Promise.all([
      Lead.find(filter).sort(sort).skip(skip).limit(lim).lean(),
      Lead.countDocuments(filter),
    ]);

    res.json({ leads, total, page: parseInt(page, 10), pages: Math.ceil(total / lim) });
  } catch (e) { next(e); }
}

async function getLead(req, res, next) {
  try {
    // BOLA fix: scope to current user
    const lead = await Lead.findOne({ _id: req.params.id, userId: req.user._id }).lean();
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    res.json(lead);
  } catch (e) { next(e); }
}

async function updateLead(req, res, next) {
  try {
    const { pipelineStatus, notes, followUpDate } = req.body;
    const update = {};
    if (pipelineStatus !== undefined) update.pipelineStatus = pipelineStatus;
    if (notes          !== undefined) update.notes          = notes;
    if (followUpDate   !== undefined) update.followUpDate   = followUpDate;

    // BOLA fix: scope to current user
    const lead = await Lead.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      update,
      { new: true }
    );
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    res.json(lead);
  } catch (e) { next(e); }
}

async function deleteLead(req, res, next) {
  try {
    const deleted = await Lead.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!deleted) return res.status(404).json({ error: 'Lead not found' });
    res.json({ ok: true });
  } catch (e) { next(e); }
}

async function deleteAllLeads(req, res, next) {
  try {
    const result = await Lead.deleteMany({ userId: req.user._id });
    res.json({ ok: true, deletedCount: result.deletedCount });
  } catch (e) { next(e); }
}

async function deleteSelectedLeads(req, res, next) {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids array is required' });
    }
    const result = await Lead.deleteMany({ _id: { $in: ids }, userId: req.user._id });
    res.json({ ok: true, deletedCount: result.deletedCount });
  } catch (e) { next(e); }
}

async function getStats(req, res, next) {
  try {
    const userId = req.user._id;
    const [total, noWebsite, socialOnly, broken, hot, contacted, replied, won] = await Promise.all([
      Lead.countDocuments({ userId }),
      Lead.countDocuments({ userId, websiteStatus: 'NO_WEBSITE' }),
      Lead.countDocuments({ userId, websiteStatus: 'SOCIAL_ONLY' }),
      Lead.countDocuments({ userId, websiteStatus: 'BROKEN' }),
      Lead.countDocuments({ userId, scoreLabel: 'HOT' }),
      Lead.countDocuments({ userId, pipelineStatus: 'CONTACTED' }),
      Lead.countDocuments({ userId, pipelineStatus: 'REPLIED' }),
      Lead.countDocuments({ userId, pipelineStatus: 'WON' }),
    ]);
    res.json({ total, noWebsite, socialOnly, broken, hot, contacted, replied, won });
  } catch (e) { next(e); }
}

module.exports = {
  getLeads,
  getLead,
  updateLead,
  deleteLead,
  deleteAllLeads,
  deleteSelectedLeads,
  getStats,
};
