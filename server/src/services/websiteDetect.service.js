const axios = require('axios');

const SOCIAL_RE = /facebook\.com|instagram\.com|twitter\.com|x\.com|linktr\.ee|linktree\.com|wa\.me|whatsapp\.com|youtube\.com|linkedin\.com/i;

async function detectWebsiteStatus(url) {
  if (!url) return 'NO_WEBSITE';
  if (SOCIAL_RE.test(url)) return 'SOCIAL_ONLY';

  try {
    // shortcut: 3s fast probe; prevents search stalls on slow/unreachable sites
    const res = await axios.get(url, {
      timeout: 3000,
      maxRedirects: 3,
      validateStatus: () => true,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) LeadScout/1.0' },
    });
    return res.status >= 400 ? 'BROKEN' : 'HAS_WEBSITE';
  } catch {
    return 'BROKEN';
  }
}

module.exports = { detectWebsiteStatus };
