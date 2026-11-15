const wa = require('../services/whatsapp.service');
const queue = require('../services/outreachQueue.service');

async function status(req, res) {
  res.json(wa.getStatus());
}

async function connect(req, res, next) {
  try {
    await wa.startSession();
    // Give Baileys a moment to generate QR
    await new Promise(r => setTimeout(r, 2000));
    res.json(wa.getStatus());
  } catch (e) { next(e); }
}

async function disconnect(req, res, next) {
  try {
    await wa.disconnect();
    res.json({ ok: true, connected: false });
  } catch (e) { next(e); }
}

async function campaignStart(req, res, next) {
  try {
    const { language, delayMin, delayMax, maxCount, targets } = req.body;
    const result = await queue.startCampaign({
      language: language || 'hinglish',
      delayMin: parseInt(delayMin, 10) || 30,
      delayMax: parseInt(delayMax, 10) || 55,
      maxCount: parseInt(maxCount, 10) || 30,
      targets:  targets || ['NO_WEBSITE', 'BROKEN'],
      userId:   req.user._id,
    });
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

async function campaignStatus(req, res) {
  res.json(queue.getCampaignStatus());
}

async function campaignStop(req, res) {
  const stopped = queue.stopCampaign();
  res.json({ stopped });
}

module.exports = { status, connect, disconnect, campaignStart, campaignStatus, campaignStop };
