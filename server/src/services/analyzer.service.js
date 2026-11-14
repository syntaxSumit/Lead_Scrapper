const axios = require('axios');
const cheerio = require('cheerio');
const dns = require('dns').promises;
const robotsParser = require('robots-parser');
const { generateJSON } = require('./ai.service');
const { externalApiQueue } = require('../middleware/rateLimit');

// ── SSRF Protection ───────────────────────────────────────────────────────────
const PRIVATE_IP_REGEX = /^(10\.|127\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|::1$|fc00:|fd)/;

async function validateUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('Invalid URL');
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only http/https URLs are allowed');
  }
  // Resolve hostname and block private/loopback IPs
  try {
    const { address } = await dns.lookup(parsed.hostname);
    if (PRIVATE_IP_REGEX.test(address)) {
      throw new Error('URL resolves to a private/internal IP address');
    }
  } catch (e) {
    if (e.message.includes('private') || e.message.includes('internal')) throw e;
    // DNS lookup failed — block to be safe
    throw new Error('Could not resolve hostname');
  }
  return parsed.href;
}

// ── Robots.txt check ──────────────────────────────────────────────────────────
async function isAllowedByCrawl(url) {
  try {
    const base = new URL(url).origin;
    const res  = await axios.get(`${base}/robots.txt`, { timeout: 5000 });
    const robots = robotsParser(`${base}/robots.txt`, res.data);
    return robots.isAllowed(url, 'LeadScout') !== false;
  } catch {
    return true; // assume allowed if robots.txt unreachable
  }
}

// ── Programmatic checks via Cheerio ──────────────────────────────────────────
function extractChecks(url, html) {
  const $ = cheerio.load(html);
  const bodyText = $('body').text().toLowerCase();
  const imgs = $('img').toArray();

  return {
    hasHttps:       url.startsWith('https://'),
    hasViewport:    $('meta[name="viewport"]').length > 0,
    hasTitle:       $('title').text().trim().length > 0,
    hasMetaDesc:    ($('meta[name="description"]').attr('content') || '').trim().length > 0,
    hasH1:          $('h1').length > 0,
    hasContactInfo: /(\d{10}|\+91|phone|contact|email)/i.test(bodyText),
    hasClickToCall: $('a[href^="tel:"]').length > 0,
    hasWhatsApp:    $('a[href*="wa.me"], a[href*="whatsapp.com"]').length > 0,
    hasContactForm: $('form').length > 0,
    hasGMapsEmbed:  $('iframe[src*="google.com/maps"]').length > 0,
    hasFavicon:     $('link[rel*="icon"]').length > 0,
    imagesHaveAlts: imgs.length === 0 || imgs.every(el => $(el).attr('alt') != null),
  };
}

// ── Google PageSpeed Insights ─────────────────────────────────────────────────
async function runPageSpeed(url) {
  const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed`;
  const res = await axios.get(endpoint, {
    params: { url, strategy: 'mobile', key: process.env.GOOGLE_PLACES_API_KEY },
    timeout: 30000,
  });
  const cats = res.data.lighthouseResult?.categories || {};
  return {
    performance:   Math.round((cats.performance?.score   || 0) * 100),
    seo:           Math.round((cats.seo?.score           || 0) * 100),
    accessibility: Math.round((cats.accessibility?.score || 0) * 100),
    bestPractices: Math.round((cats['best-practices']?.score || 0) * 100),
  };
}

// ── AI: website analysis ──────────────────────────────────────────────────────
async function callAIWebsite({ lead, html, checks, pageSpeed }) {
  const prompt = `You are a senior web consultant auditing a local business website for a web agency pitch.

Business: ${lead.name}
Category: ${lead.category || 'N/A'}
Address:  ${lead.address || 'N/A'}
Google Rating: ${lead.rating ?? 'N/A'} (${lead.reviewCount ?? 0} reviews)
Website: ${lead.websiteUrl}

Programmatic checks (true = passing):
${JSON.stringify(checks, null, 2)}

PageSpeed Insights (mobile, 0–100):
${JSON.stringify(pageSpeed, null, 2)}

Page content (plain text, stripped):
<untrusted_content>
${html}
</untrusted_content>

Return ONLY valid JSON — no markdown, no explanation:
{
  "overallScore": 75,
  "strengths": ["Clear phone number", "Fast server response"],
  "weaknesses": ["No SSL certificate", "Missing mobile viewport"],
  "designImpression": "One sentence summary of the site look and user experience",
  "seoIssues": ["Missing meta description"],
  "conversionIssues": ["No WhatsApp button or quick contact form"],
  "quickWins": ["Add direct WhatsApp link", "Fix viewport tag"],
  "suggestedPitchAngle": "Pitch an updated mobile-first redesign with online booking to capture search traffic."
}`;

  return generateJSON({
    systemPrompt: 'You are an expert agency website auditor. You output strictly valid JSON.',
    prompt,
  });
}

// ── AI: no-website analysis ───────────────────────────────────────────────────
async function callAINoWebsite(lead) {
  const prompt = `You are a web consultant. This local business has no website (status: ${lead.websiteStatus}).

Business: ${lead.name}
Category: ${lead.category || 'N/A'}
Address:  ${lead.address || 'N/A'}
Google Rating: ${lead.rating ?? 'N/A'} (${lead.reviewCount ?? 0} reviews)

Write a brief analysis on how a professional website would specifically help THIS business.
Return ONLY valid JSON:
{
  "overallScore": 0,
  "strengths": ["High Google rating and established reputation"],
  "weaknesses": ["No dedicated domain", "Losing local customer traffic to competitors with websites"],
  "designImpression": "No website found",
  "seoIssues": ["Not discoverable on Google Search without an official domain"],
  "conversionIssues": ["Potential customers cannot view full services, pricing, or direct inquiry form"],
  "quickWins": ["Launch a simple 3-page high-converting website with WhatsApp chat integration"],
  "suggestedPitchAngle": "They already have strong reviews; a modern website will convert map viewers into paying customers."
}`;

  return generateJSON({
    systemPrompt: 'You are a web consultant advising local businesses. You output strictly valid JSON.',
    prompt,
  });
}

// ── Main exported function ────────────────────────────────────────────────────
async function analyzeWebsite(lead) {
  if (['NO_WEBSITE', 'SOCIAL_ONLY'].includes(lead.websiteStatus) || !lead.websiteUrl) {
    const result = await externalApiQueue(() => callAINoWebsite(lead));
    return { ...result, analyzedAt: new Date() };
  }

  // CRIT-02: SSRF protection — validate URL before fetching
  let url;
  try {
    url = await validateUrl(lead.websiteUrl);
  } catch (e) {
    return { error: `URL validation failed: ${e.message}`, analyzedAt: new Date() };
  }

  const allowed = await isAllowedByCrawl(url);
  if (!allowed) return { error: 'robots.txt disallows crawling', analyzedAt: new Date() };

  let html = '';
  let checks = {};
  try {
    const res = await externalApiQueue(() =>
      axios.get(url, {
        timeout: 10000,
        maxRedirects: 5,
        headers: { 'User-Agent': 'LeadScout/1.0 (website analysis; non-indexing)' },
      })
    );
    html   = typeof res.data === 'string' ? res.data : '';
    checks = extractChecks(url, html);
  } catch {
    checks = { fetchError: true };
  }

  let pageSpeed = {};
  try {
    pageSpeed = await externalApiQueue(() => runPageSpeed(url));
  } catch {
    pageSpeed = {}; // PageSpeed is optional; don't fail the whole analysis
  }

  // LOW-04: Strip HTML tags before passing to AI — reduces prompt injection risk
  const safeHtml = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 5000);

  const aiResult = await externalApiQueue(() =>
    callAIWebsite({ lead, html: safeHtml, checks, pageSpeed })
  );

  return { ...aiResult, checks, pageSpeed, analyzedAt: new Date() };
}

module.exports = { analyzeWebsite };
