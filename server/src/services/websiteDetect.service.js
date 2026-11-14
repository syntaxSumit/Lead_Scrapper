const axios = require('axios');

const SOCIAL_RE = /facebook\.com|instagram\.com|twitter\.com|x\.com|linktr\.ee|linktree\.com|wa\.me|whatsapp\.com|youtube\.com|linkedin\.com/i;

async function detectWebsiteStatus(url) {
  if (!url) return 'NO_WEBSITE';
  if (SOCIAL_RE.test(url)) return 'SOCIAL_ONLY';

  try {
    const res = await axios.get(url, {
      timeout: 8000,
      maxRedirects: 5,
      validateStatus: null,
      headers: { 'User-Agent': 'LeadScout/1.0 (website availability check)' },
    });
    return res.status >= 400 ? 'BROKEN' : 'HAS_WEBSITE';
  } catch {
    return 'BROKEN';
  }
}

module.exports = { detectWebsiteStatus };
