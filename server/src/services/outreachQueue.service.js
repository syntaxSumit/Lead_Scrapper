const Lead = require('../models/Lead');
const { sendMessage, getStatus } = require('./whatsapp.service');
const { generateOutreach } = require('./outreach.service');

// ── In-memory campaign state ──────────────────────────────────────────────────
let campaign = {
  running: false,
  total: 0,
  sent: 0,
  failed: 0,
  skipped: 0,
  current: null,       // name of the business being processed
  logs: [],            // last 50 log entries
  stopRequested: false,
};

function addLog(msg, type = 'info') {
  campaign.logs.push({ msg, type, ts: new Date().toISOString() });
  if (campaign.logs.length > 50) campaign.logs.shift();
  console.log(`[campaign:${type}]`, msg);
}

function randomDelay(min, max) {
  const ms = (Math.floor(Math.random() * (max - min + 1)) + min) * 1000;
  return new Promise(r => setTimeout(r, ms));
}

/**
 * Start an auto-outreach campaign.
 * @param {Object} opts
 * @param {string} opts.language - 'hinglish' | 'hindi' | 'english'
 * @param {number} opts.delayMin - min seconds between messages (default 30)
 * @param {number} opts.delayMax - max seconds between messages (default 55)
 * @param {number} opts.maxCount - max messages this run (default 30)
 * @param {string[]} opts.targets - ['NO_WEBSITE', 'BROKEN'] etc
 * @param {string} opts.userId - authenticated user's _id
 */
async function startCampaign({ language = 'hinglish', delayMin = 30, delayMax = 55, maxCount = 30, targets = ['NO_WEBSITE', 'BROKEN'], userId }) {
  if (campaign.running) throw new Error('Campaign already running');

  const waStatus = getStatus();
  if (!waStatus.connected) throw new Error('WhatsApp not connected — scan QR first');

  // Fetch eligible leads: has phone, not yet contacted, matching website status
  const leads = await Lead.find({
    userId,
    websiteStatus: { $in: targets },
    phone: { $ne: null, $exists: true, $nin: ['', null] },
    pipelineStatus: 'NEW', // only reach out to new leads
  }).limit(maxCount).lean();

  if (leads.length === 0) throw new Error('No eligible leads found (need phone number + NEW status + matching website status)');

  // Reset state
  campaign = {
    running: true,
    total: leads.length,
    sent: 0,
    failed: 0,
    skipped: 0,
    current: null,
    logs: [],
    stopRequested: false,
  };

  addLog(`Campaign started: ${leads.length} leads, language=${language}, delay=${delayMin}-${delayMax}s`);

  // Process in background (non-blocking)
  processQueue(leads, { language, delayMin, delayMax }).catch(err => {
    addLog(`Campaign crashed: ${err.message}`, 'error');
    campaign.running = false;
  });

  return { total: leads.length };
}

async function processQueue(leads, { language, delayMin, delayMax }) {
  for (let i = 0; i < leads.length; i++) {
    if (campaign.stopRequested) {
      addLog('Campaign stopped by user', 'warn');
      break;
    }

    // Check WhatsApp still connected
    if (!getStatus().connected) {
      addLog('WhatsApp disconnected — pausing campaign', 'error');
      break;
    }

    const lead = leads[i];
    campaign.current = lead.name;

    try {
      // 1) Generate a personalized AI pitch for this lead
      addLog(`[${i + 1}/${leads.length}] Generating pitch for ${lead.name}...`);
      const outreach = await generateOutreach({ lead, language });
      const message = outreach.whatsapp;

      if (!message) {
        addLog(`Skipped ${lead.name} — empty AI message`, 'warn');
        campaign.skipped++;
        continue;
      }

      // 2) Send via WhatsApp
      addLog(`Sending to ${lead.name} (${lead.phone})...`);
      await sendMessage(lead.phone, message);

      // 3) Update lead in DB: pipeline -> CONTACTED, store outreach
      await Lead.findByIdAndUpdate(lead._id, {
        pipelineStatus: 'CONTACTED',
        outreach: { ...outreach, language, generatedAt: new Date() },
        notes: `[Auto-outreach] WhatsApp sent at ${new Date().toLocaleString('en-IN')}`,
      });

      campaign.sent++;
      addLog(`✓ Sent to ${lead.name}`, 'success');

      // 4) Anti-ban jitter delay (skip delay after last message)
      if (i < leads.length - 1 && !campaign.stopRequested) {
        const waitSec = Math.floor(Math.random() * (delayMax - delayMin + 1)) + delayMin;
        addLog(`Waiting ${waitSec}s before next...`);
        await randomDelay(delayMin, delayMax);
      }

    } catch (err) {
      campaign.failed++;
      addLog(`✗ Failed for ${lead.name}: ${err.message}`, 'error');
    }
  }

  campaign.running = false;
  campaign.current = null;
  addLog(`Campaign finished: ${campaign.sent} sent, ${campaign.failed} failed, ${campaign.skipped} skipped`);
}

function getCampaignStatus() {
  return { ...campaign };
}

function stopCampaign() {
  if (!campaign.running) return false;
  campaign.stopRequested = true;
  return true;
}

module.exports = { startCampaign, getCampaignStatus, stopCampaign };
